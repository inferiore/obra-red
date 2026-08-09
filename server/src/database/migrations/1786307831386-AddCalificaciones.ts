import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCalificaciones1786307831386 implements MigrationInterface {
    name = 'AddCalificaciones1786307831386'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "calificaciones" ("id" varchar PRIMARY KEY NOT NULL, "solicitudId" varchar NOT NULL, "clienteUsername" varchar NOT NULL, "clienteNombre" varchar NOT NULL, "tipo" varchar NOT NULL, "trabajadorUsername" varchar NOT NULL, "estrellas" integer NOT NULL, "comentario" text, "etiquetas" text NOT NULL DEFAULT ('[]'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_21324e488b2ce4a7b19259ea184" UNIQUE ("solicitudId"))`);
        await queryRunner.query(`CREATE TABLE "temporary_calificaciones" ("id" varchar PRIMARY KEY NOT NULL, "solicitudId" varchar NOT NULL, "clienteUsername" varchar NOT NULL, "clienteNombre" varchar NOT NULL, "tipo" varchar NOT NULL, "trabajadorUsername" varchar NOT NULL, "estrellas" integer NOT NULL, "comentario" text, "etiquetas" text NOT NULL DEFAULT ('[]'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_21324e488b2ce4a7b19259ea184" UNIQUE ("solicitudId"), CONSTRAINT "FK_21324e488b2ce4a7b19259ea184" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_calificaciones"("id", "solicitudId", "clienteUsername", "clienteNombre", "tipo", "trabajadorUsername", "estrellas", "comentario", "etiquetas", "createdAt") SELECT "id", "solicitudId", "clienteUsername", "clienteNombre", "tipo", "trabajadorUsername", "estrellas", "comentario", "etiquetas", "createdAt" FROM "calificaciones"`);
        await queryRunner.query(`DROP TABLE "calificaciones"`);
        await queryRunner.query(`ALTER TABLE "temporary_calificaciones" RENAME TO "calificaciones"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calificaciones" RENAME TO "temporary_calificaciones"`);
        await queryRunner.query(`CREATE TABLE "calificaciones" ("id" varchar PRIMARY KEY NOT NULL, "solicitudId" varchar NOT NULL, "clienteUsername" varchar NOT NULL, "clienteNombre" varchar NOT NULL, "tipo" varchar NOT NULL, "trabajadorUsername" varchar NOT NULL, "estrellas" integer NOT NULL, "comentario" text, "etiquetas" text NOT NULL DEFAULT ('[]'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_21324e488b2ce4a7b19259ea184" UNIQUE ("solicitudId"))`);
        await queryRunner.query(`INSERT INTO "calificaciones"("id", "solicitudId", "clienteUsername", "clienteNombre", "tipo", "trabajadorUsername", "estrellas", "comentario", "etiquetas", "createdAt") SELECT "id", "solicitudId", "clienteUsername", "clienteNombre", "tipo", "trabajadorUsername", "estrellas", "comentario", "etiquetas", "createdAt" FROM "temporary_calificaciones"`);
        await queryRunner.query(`DROP TABLE "temporary_calificaciones"`);
        await queryRunner.query(`DROP TABLE "calificaciones"`);
    }

}
