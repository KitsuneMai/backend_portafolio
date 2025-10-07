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

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,

    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly productsService: ProductsService,
  ) {}

  /**
   * Crea una venta completa con sus items
   */
  async create(dto: CreateSaleDto, userPayload: any): Promise<Sale> {
    return await this.saleRepository.manager.transaction(async (manager) => {
      // CARGAMOS EL USER COMPLETO DESDE LA DB
      const user = await manager.findOne(User, { where: { id: userPayload.id || userPayload.userId } });
      if (!user) throw new NotFoundException('Usuario no encontrado');

      let subtotal = 0;
      let ivaTotal = 0;
      let total = 0;

      // PRIMERO validamos productos y calculamos totales
      const itemsToCreate: Array<{
        product: Product;
        quantity: number;
        price: number;
        iva: number;
        priceWithIva: number;
        itemSubtotal: number;
        itemTotal: number;
      }> = [];
      
      for (const itemDto of dto.items) {
        const product = await manager.findOne(Product, { where: { id: itemDto.productId } });
        if (!product) throw new NotFoundException(`Producto no encontrado`);
        if (product.stock < itemDto.quantity)
          throw new BadRequestException(`Stock insuficiente para ${product.name}`);

        const price = Number(product.basePrice);
        const iva = Number(product.ivaPercentage);
        const priceWithIva = +(price + price * (iva / 100)).toFixed(2);
        const itemSubtotal = +(price * itemDto.quantity).toFixed(2);
        const itemTotal = +(priceWithIva * itemDto.quantity).toFixed(2);
        const itemIvaTotal = +(itemTotal - itemSubtotal).toFixed(2);

        subtotal += itemSubtotal;
        ivaTotal += itemIvaTotal;
        total += itemTotal;

        itemsToCreate.push({
          product,
          quantity: itemDto.quantity,
          price,
          iva,
          priceWithIva,
          itemSubtotal,
          itemTotal,
        });
      }

      //  Creamos la venta CON LOS TOTALES YA CALCULADOS
      // Usamos createQueryBuilder para forzar un INSERT puro
      const insertResult = await manager
        .createQueryBuilder()
        .insert()
        .into(Sale)
        .values([{
          customerName: dto.customerName,
          subtotal: subtotal,
          ivaTotal: ivaTotal,
          total: total,
          user: user, // Pasamos el objeto user completo
        }])
        .execute();

      const saleId = insertResult.identifiers[0].id;

      //  Creamos los items
      for (const itemData of itemsToCreate) {
        await manager.insert(SaleItem, {
          sale: { id: saleId },
          product: { id: itemData.product.id },
          quantity: itemData.quantity,
          price: itemData.price,
          ivaPercentage: itemData.iva,
          priceWithIva: itemData.priceWithIva,
          subtotal: itemData.itemSubtotal,
          total: itemData.itemTotal,
        });

        // Decrementamos stock
        await manager.decrement(Product, { id: itemData.product.id }, 'stock', itemData.quantity);
      }

      // Recuperamos venta completa con relaciones
      const fullSale = await manager.findOne(Sale, {
        where: { id: saleId },
        relations: ['items', 'items.product', 'user'],
      });

      if (!fullSale) throw new NotFoundException('Error al recuperar la venta creada');

      return fullSale;
    });
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

    if (!sale) throw new NotFoundException(`Venta #${id} no encontrada`);
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