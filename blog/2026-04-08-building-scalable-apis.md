---
title: Building Scalable APIs with NestJS and PostgreSQL
date: 2026-04-08
author: Faris Baros
tags: backend, nestjs, architecture, database
image: https://cdn.intuji.com/2022/09/Nestjs_hero1.png
---

# Building Scalable APIs with NestJS and PostgreSQL

Building production-grade APIs requires more than just connecting a database to a web server. It demands thoughtful architecture, proper error handling, and scalability patterns that grow with your user base. In this post, I'll walk through the core principles I've used to architect systems handling millions of transactions at Maybank Indonesia.

**Image Caption:** A modern API architecture stack featuring NestJS, PostgreSQL, and Docker containerization for enterprise-scale systems.

## Table of Contents

1. [Architecture Foundations](#architecture-foundations)
2. [Database Design Patterns](#database-design-patterns)
3. [API Layer Implementation](#api-layer-implementation)
4. [Performance Optimization](#performance-optimization)
5. [Monitoring and Observability](#monitoring-and-observability)
6. [Conclusion](#conclusion)

---

## Architecture Foundations

The foundation of any scalable API is a well-thought-out architecture. I typically use a layered approach:

### Core Layers

**Controller Layer** — Handles HTTP requests/responses and basic validation. Controllers are thin and delegate business logic to services.

```javascript
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  async create(@Body() createDto: CreateTransactionDto) {
    return this.transactionService.create(createDto);
  }
}
```

**Service Layer** — Contains all business logic. Services are reusable and testable, keeping controllers clean.

```javascript
@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly repo: Repository<Transaction>,
    private readonly logger: Logger,
  ) {}

  async create(dto: CreateTransactionDto): Promise<Transaction> {
    // Validate business rules
    // Execute transaction
    // Emit events
    return this.repo.save(transaction);
  }
}
```

**Repository Layer** — Abstracts database access. Using TypeORM repositories keeps your database logic isolated.

The key principle: **each layer has one responsibility**. Controllers don't touch the database. Services don't format HTTP responses. This separation makes testing and refactoring painless.

---

## Database Design Patterns

PostgreSQL is powerful, but bad schema design kills performance at scale.

### Indexing Strategy

Your queries are only as fast as your indexes. Always index:

- Foreign keys
- Frequently filtered columns
- Sort keys

```sql
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status) WHERE status != 'completed';
```

Notice the last one? **Partial indexes** save space and improve query performance by only indexing rows you actually query.

### Connection Pooling

Don't create a new database connection per request. Use connection pooling with PgBouncer or TypeORM's built-in pool:

```javascript
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: 5432,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      poolSize: 10,
      maxQueryExecutionTime: 1000,
    }),
  ],
})
export class DatabaseModule {}
```

Setting `poolSize: 10` means 10 concurrent connections. For high-traffic services, you might need 20-50 depending on your workload.

### Transaction Management

For operations that must be atomic, use explicit transactions:

```javascript
async transferFunds(from: User, to: User, amount: number) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await queryRunner.manager.update(Account, from.id, {
      balance: () => `balance - ${amount}`,
    });
    await queryRunner.manager.update(Account, to.id, {
      balance: () => `balance + ${amount}`,
    });
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

This ensures both updates succeed or both fail — **no partial state**.

---

## API Layer Implementation

Building the actual API layer requires attention to versioning, validation, and error handling.

### Request Validation

Use DTOs (Data Transfer Objects) with class-validator:

```javascript
import { IsEmail, IsNumber, Min, Max } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @Min(0.01)
  @Max(1000000)
  amount: number;

  @IsEmail()
  recipientEmail: string;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description: string;
}
```

NestJS validates incoming requests automatically and returns 400 errors for invalid data. No manual validation code needed.

### Error Handling

Centralized error handling keeps responses consistent:

```javascript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = 500;
    let message = 'Internal server error';

    if (exception instanceof BadRequestException) {
      status = 400;
      message = exception.getResponse();
    } else if (exception instanceof NotFoundException) {
      status = 404;
      message = 'Resource not found';
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## Performance Optimization

Once your API is working, optimization becomes critical.

### Caching Strategy

Cache frequently accessed, rarely-changing data:

```javascript
@Injectable()
export class UserService {
  constructor(
    private readonly cacheManager: Cache,
    private readonly repo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const cached = await this.cacheManager.get(`user:${id}`);
    if (cached) return cached;

    const user = await this.repo.findOne({ where: { id } });
    await this.cacheManager.set(`user:${id}`, user, 3600000); // 1 hour TTL
    return user;
  }
}
```

**Cache invalidation** is harder than caching. Always set TTLs and invalidate on updates.

### Query Optimization

Use `.select()` to fetch only needed columns:

```javascript
// BAD: fetches all columns
const users = await this.repo.find()

// GOOD: fetches only what you need
const users = await this.repo.find({
  select: ['id', 'email', 'name'],
})
```

This reduces payload size and database work. For large tables, the difference is huge.

### Pagination

Never fetch all records at once:

```javascript
async findAll(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  const [data, total] = await this.repo.findAndCount({
    skip,
    take: limit,
    order: { createdAt: 'DESC' },
  });
  return { data, total, page, pages: Math.ceil(total / limit) };
}
```

---

## Monitoring and Observability

You can't optimize what you can't measure.

### Structured Logging

Use structured logging (JSON) instead of plain text:

```javascript
this.logger.log(
  JSON.stringify({
    event: 'transaction_created',
    transactionId: transaction.id,
    userId: transaction.userId,
    amount: transaction.amount,
    duration: Date.now() - startTime,
  })
)
```

This makes logs machine-readable and searchable in systems like ELK or Datadog.

### Performance Monitoring

Track slow queries:

```javascript
@Injectable()
export class QuerySlowInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const start = Date.now();
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        if (duration > 1000) {
          console.warn(`Slow query detected: ${duration}ms`);
        }
      }),
    );
  }
}
```

Set alerts at your monitoring tool for queries over 1 second.

---

## Conclusion

Building scalable APIs isn't about one magic trick — it's about consistent application of architecture principles:

1. **Separate concerns** — Controllers, services, repositories each have one job
2. **Design databases carefully** — Indexes, pooling, transactions matter
3. **Validate and handle errors** — Do it centrally and consistently
4. **Cache strategically** — Not everywhere, only where it helps
5. **Measure everything** — What you can't measure, you can't improve

These patterns have served me well across systems processing millions of daily transactions. Start with clean architecture, then optimize based on real metrics, not guesses.

The code examples here use NestJS and TypeORM, but the principles apply to any framework. **Start simple, measure, then scale.**

---

**Have thoughts on API architecture? I'd love to hear your approach. Drop a comment below or reach out on Twitter.**
