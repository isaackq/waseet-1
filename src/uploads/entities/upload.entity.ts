// import {
//   Column,
//   CreateDateColumn,
//   DeleteDateColumn,
//   Entity,
//   PrimaryGeneratedColumn,
//   UpdateDateColumn,
// } from 'typeorm';
// import { fileTypesEnum } from '../enums/file-type.enum';

// @Entity('uploads')
// export class Upload {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({
//     type: 'varchar',
//     length: 1024,
//     nullable: false,
//   })
//   name: string;

//   @Column({
//     type: 'varchar',
//     length: 1024,
//     nullable: false,
//   })
//   path: string;

//   @Column({
//     type: 'enum',
//     enum: fileTypesEnum,
//     default: fileTypesEnum.IMAGE,
//     nullable: false,
//   })
//   type: string;

//   @Column({
//     type: 'varchar',
//     length: 128,
//     nullable: false,
//   })
//   mime: string;

//   @Column({
//     type: 'varchar',
//     length: 1024,
//     nullable: false,
//   })
//   size: number;

//   @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
//   createdAt: Date;

//   @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
//   updatedAt: Date;

//   @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
//   deletedAt?: Date;
// }
