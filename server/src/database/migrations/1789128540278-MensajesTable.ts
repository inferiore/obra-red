import { MigrationInterface, QueryRunner } from "typeorm";

export class MensajesTable1789128540278 implements MigrationInterface {
    name = 'MensajesTable1789128540278'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "mensajes" ("id" varchar PRIMARY KEY NOT NULL, "solicitudId" varchar NOT NULL, "autorUsername" varchar NOT NULL, "contenido" text NOT NULL, "leidoPorDestinatario" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "mensajes"`);
    }

}
