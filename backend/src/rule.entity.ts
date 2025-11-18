import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('rules')
export class RuleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  descriptionContains: string;

  @Column()
  categoryId: number;

  @Column()
  supplierId: number;
}
