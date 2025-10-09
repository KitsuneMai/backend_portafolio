import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { ProductsService } from 'src/products/products.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { User } from 'src/users/user.entity';
import { Product } from 'src/products/entities/product.entity';
import { PurchasesService } from 'src/purchases/purchases.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,

    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,

    private readonly purchasesService: PurchasesService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly productsService: ProductsService,
  ) {}

  /**
   * Crea una venta completa con sus items
   */
  async create(dto: CreateSaleDto, userPayload: any): Promise<Sale> {
    return await this.saleRepository.manager.transaction(async (manager) => {
      // Cargamos el user completo desde la DB
      const user = await manager.findOne(User, { 
        where: { id: userPayload.id || userPayload.userId } 
      });
      if (!user) throw new NotFoundException('Usuario no encontrado');

      let subtotal = 0;
      let ivaTotal = 0;
      let total = 0;

      // Preparamos items
      const itemsToCreate: Array<{
        product: Product;
        quantity: number;
        price: number;
        ivaPercentage: number | undefined;
        profitPercentage: number | undefined;
        finalPrice: number;
        itemSubtotal: number;
        itemTotal: number;
      }> = [];

      for (const itemDto of dto.items) {
        const product = await manager.findOne(Product, { 
          where: { id: itemDto.productId } 
        });
        
        if (!product) {
          throw new NotFoundException(`Producto no encontrado`);
        }
        
        if (product.stock < itemDto.quantity) {
          throw new BadRequestException(`Stock insuficiente para ${product.name}`);
        }

        // --- CÁLCULOS ---
        const basePrice = Number(product.basePrice);
        const ivaPercentage = product.ivaPercentage ?? 0; // null → 0, solo informativo
        const profitPercentage = product.profitPercentage ?? 0; // null → 0

        // Precio final = basePrice + ganancia
        // (El IVA ya está incluido en basePrice, no se suma aquí)
        let finalPrice = basePrice;
        if (profitPercentage > 0) {
          finalPrice = basePrice * (1 + profitPercentage / 100);
        }

        finalPrice = +finalPrice.toFixed(2);

        // Totales del item
        const itemSubtotal = +(basePrice * itemDto.quantity).toFixed(2);
        const itemTotal = +(finalPrice * itemDto.quantity).toFixed(2);

        // Acumular totales de la venta
        subtotal += itemSubtotal;
        total += itemTotal;
        // ivaTotal siempre es 0 (el IVA está incluido en basePrice)

        itemsToCreate.push({
          product,
          quantity: itemDto.quantity,
          price: basePrice,
          ivaPercentage: ivaPercentage > 0 ? ivaPercentage : undefined, // undefined en vez de null
          profitPercentage: profitPercentage > 0 ? profitPercentage : undefined, // undefined en vez de null
          finalPrice,
          itemSubtotal,
          itemTotal,
        });
      }

      // --- INSERT DE LA VENTA ---
      const insertResult = await manager
        .createQueryBuilder()
        .insert()
        .into(Sale)
        .values([{
          customerName: dto.customerName,
          subtotal,
          ivaTotal: 0, // Siempre 0 porque el IVA ya está incluido en basePrice
          total,
          user,
        }])
        .execute();

      const saleId = insertResult.identifiers[0].id;

      // --- INSERT DE LOS ITEMS ---
      for (const itemData of itemsToCreate) {
        const saleItemData: any = {
          sale: { id: saleId },
          product: { id: itemData.product.id },
          quantity: itemData.quantity,
          price: itemData.price,
          finalPrice: itemData.finalPrice,
          subtotal: itemData.itemSubtotal,
          total: itemData.itemTotal,
        };

        // Solo agregar si tienen valor (evitar null/undefined)
        if (itemData.ivaPercentage !== undefined) {
          saleItemData.ivaPercentage = itemData.ivaPercentage;
        }
        if (itemData.profitPercentage !== undefined) {
          saleItemData.profitPercentage = itemData.profitPercentage;
        }

        await manager.insert(SaleItem, saleItemData);

        // Decrementar stock
        await manager.decrement(
          Product, 
          { id: itemData.product.id }, 
          'stock', 
          itemData.quantity
        );
      }

      // --- RECUPERAR VENTA COMPLETA ---
      const fullSale = await manager.findOne(Sale, {
        where: { id: saleId },
        relations: ['items', 'items.product', 'user'],
      });

      if (!fullSale) {
        throw new NotFoundException('Error al recuperar la venta creada');
      }

      return fullSale;
    });
  }

    async getFinancialMetrics() {
    // Traer todas las ventas con items y producto
    const sales = await this.saleRepository.find({
      relations: ['items', 'items.product'],
    });

    // Traer todas las compras con items y producto
    const purchases = await this.purchasesService.findAll(); // ya tienes items y product

    // Agrupar compras por producto para calcular costo promedio
    const costMap: Record<number, { totalQty: number; totalCost: number }> = {};
    for (const purchase of purchases) {
      for (const item of purchase.items) {
        const pid = item.product.id;
        if (!costMap[pid]) costMap[pid] = { totalQty: 0, totalCost: 0 };
        costMap[pid].totalQty += Number(item.quantity);
        costMap[pid].totalCost += Number(item.price) * Number(item.quantity);
      }
    }

    // Agrupar ventas por producto y calcular métricas
    const metricsMap: Record<number, any> = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        const pid = item.product.id;
        const soldQty = Number(item.quantity);
        const revenue = Number(item.total); // total por item
        const costInfo = costMap[pid] || { totalQty: 0, totalCost: 0 };
        const avgCost = costInfo.totalQty ? costInfo.totalCost / costInfo.totalQty : 0;
        const profit = revenue - soldQty * avgCost;
        const margin = avgCost ? profit / (soldQty * avgCost) : 0;

        if (!metricsMap[pid]) {
          metricsMap[pid] = {
            productId: pid,
            productName: item.product.name,
            totalSoldQty: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
          };
        }

        metricsMap[pid].totalSoldQty += soldQty;
        metricsMap[pid].totalRevenue += revenue;
        metricsMap[pid].totalCost += soldQty * avgCost;
        metricsMap[pid].totalProfit += profit;
      }
    }

    // Calcular rentabilidad promedio
    const result = Object.values(metricsMap).map((m) => ({
      ...m,
      avgProfitMargin: m.totalCost ? +(m.totalProfit / m.totalCost).toFixed(2) : 0,
    }));

    // Crecimiento mensual (simplificado)
    // Agrupamos por mes del año de la venta
    const monthlyRevenue: Record<string, number> = {};
    for (const sale of sales) {
      const monthKey = sale.date.toISOString().slice(0, 7); // YYYY-MM
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + Number(sale.total);
    }

    return { productMetrics: result, monthlyRevenue };
  }

  /**
   * Obtiene todas las ventas registradas
   */
  async findAll(): Promise<Sale[]> {
    return this.saleRepository.find({
      relations: ['items', 'items.product', 'user'],
      order: { date: 'DESC' },
    });
  }

  /**
   * Obtiene una venta por ID
   */
  async findOne(id: number): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user'],
    });

    if (!sale) {
      throw new NotFoundException(`Venta #${id} no encontrada`);
    }
    
    return sale;
  }

  /**
   * Obtiene las ventas de un usuario específico
   */
  async findSalesByUser(userId: string): Promise<Sale[]> {
    return this.saleRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'items', 'items.product'],
      order: { date: 'DESC' },
    });
  }
}