import { MigrationInterface, QueryRunner } from "typeorm";

export class AddObjectToNotificaciones1790519890113 implements MigrationInterface {
    name = 'AddObjectToNotificaciones1790519890113'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_notificaciones" ("id" varchar PRIMARY KEY NOT NULL, "userUsername" varchar NOT NULL, "tipo" varchar NOT NULL, "mensaje" varchar NOT NULL, "solicitudId" varchar, "leido" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "object" varchar, "objectId" varchar)`);
        await queryRunner.query(`INSERT INTO "temporary_notificaciones"("id", "userUsername", "tipo", "mensaje", "solicitudId", "leido", "createdAt") SELECT "id", "userUsername", "tipo", "mensaje", "solicitudId", "leido", "createdAt" FROM "notificaciones"`);
        await queryRunner.query(`DROP TABLE "notificaciones"`);
        await queryRunner.query(`ALTER TABLE "temporary_notificaciones" RENAME TO "notificaciones"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notificaciones" RENAME TO "temporary_notificaciones"`);
        await queryRunner.query(`CREATE TABLE "notificaciones" ("id" varchar PRIMARY KEY NOT NULL, "userUsername" varchar NOT NULL, "tipo" varchar NOT NULL, "mensaje" varchar NOT NULL, "solicitudId" varchar, "leido" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "notificaciones"("id", "userUsername", "tipo", "mensaje", "solicitudId", "leido", "createdAt") SELECT "id", "userUsername", "tipo", "mensaje", "solicitudId", "leido", "createdAt" FROM "temporary_notificaciones"`);
        await queryRunner.query(`DROP TABLE "temporary_notificaciones"`);
    }

}
