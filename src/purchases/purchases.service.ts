import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase } from './entities/purchase.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { Product } from 'src/products/entities/product.entity';
import { User } from '../users/user.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchaseRepository: Repository<Purchase>,

    @InjectRepository(PurchaseItem)
    private readonly purchaseItemRepository: Repository<PurchaseItem>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreatePurchaseDto, userPayload: any) {
    // Buscar el usuario que registra la compra
    const user = await this.userRepository.findOne({ where: { id: userPayload.userId } });
    if (!user) throw new NotFoundException('User not found');

    // Crear la compra
    const purchase = this.purchaseRepository.create({
      user,
      supplier: dto.supplier,
      notes: dto.notes,
      items: [],
    });

    // Iterar los items de la compra
    for (const itemDto of dto.items) {
      const product = await this.productRepository.findOne({ where: { id: itemDto.productId } });
      if (!product) throw new NotFoundException(`Product ID ${itemDto.productId} not found`);

      // Crear el item de compra
      const purchaseItem = this.purchaseItemRepository.create({
        product,
        quantity: itemDto.quantity,
        price: itemDto.price,
      });

      // Añadir item a la compra
      purchase.items.push(purchaseItem);

      // Actualizar stock correctamente (decimal convertido a number)
      product.stock = Number(product.stock || 0) + Number(itemDto.quantity);
      await this.productRepository.save(product);
    }

    // Guardar la compra junto con los items (cascade: true)
    const savedPurchase = await this.purchaseRepository.save(purchase);

    // Retornar la compra con items y usuario cargados
    return this.purchaseRepository.findOne({
      where: { id: savedPurchase.id },
      relations: ['items', 'items.product', 'user'],
    });
  }

    async getFinancialMetrics() {
    const purchases = await this.purchaseRepository.find({ relations: ['items', 'items.product'] });

    let totalSpent = 0;
    let totalStockAdded = 0;
    const productStats: Record<number, { totalQuantity: number; totalCost: number }> = {};

    for (const purchase of purchases) {
      for (const item of purchase.items) {
        const cost = Number(item.price) * Number(item.quantity);
        totalSpent += cost;
        totalStockAdded += Number(item.quantity);

        if (!productStats[item.product.id]) {
          productStats[item.product.id] = { totalQuantity: 0, totalCost: 0 };
        }

        productStats[item.product.id].totalQuantity += Number(item.quantity);
        productStats[item.product.id].totalCost += cost;
      }
    }

    const profitability = Object.entries(productStats).map(([productId, stats]) => ({
      productId,
      avgPrice: stats.totalCost / stats.totalQuantity,
      totalQuantity: stats.totalQuantity,
    }));

    return {
      totalSpent,
      totalStockAdded,
      profitability,
    };
  }

  async findAll() {
    return this.purchaseRepository.find({ relations: ['items', 'items.product', 'user'] });
  }

  async findOne(id: number) {
    const purchase = await this.purchaseRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user'],
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }
}
