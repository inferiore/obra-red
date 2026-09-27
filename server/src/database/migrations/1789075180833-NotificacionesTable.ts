import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificacionesTable1789075180833 implements MigrationInterface {
    name = 'NotificacionesTable1789075180833'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notificaciones" ("id" varchar PRIMARY KEY NOT NULL, "userUsername" varchar NOT NULL, "tipo" varchar NOT NULL, "mensaje" varchar NOT NULL, "solicitudId" varchar, "leido" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "notificaciones"`);
    }

}
