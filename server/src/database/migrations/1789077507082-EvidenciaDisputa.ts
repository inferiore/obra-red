import { MigrationInterface, QueryRunner } from "typeorm";

export class EvidenciaDisputa1789077507082 implements MigrationInterface {
    name = 'EvidenciaDisputa1789077507082'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_solicitudes" ("id" varchar PRIMARY KEY NOT NULL, "clienteUsername" varchar NOT NULL, "clienteNombre" varchar NOT NULL, "tipo" varchar NOT NULL, "descripcion" text NOT NULL, "presupuesto" integer NOT NULL, "ubicacion" varchar NOT NULL, "fotos" text NOT NULL DEFAULT ('[]'), "estado" varchar NOT NULL DEFAULT ('borrador'), "trabajadorAsignado" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "evidenciaAntes" text NOT NULL DEFAULT ('[]'), "evidenciaDurante" text NOT NULL DEFAULT ('[]'), "evidenciaDespues" text NOT NULL DEFAULT ('[]'), "evidenciaNota" text, "correcciones" text NOT NULL DEFAULT ('[]'), "correccionesCount" integer NOT NULL DEFAULT (0), "evidenciaDisputa" text NOT NULL DEFAULT ('[]'))`);
        await queryRunner.query(`INSERT INTO "temporary_solicitudes"("id", "clienteUsername", "clienteNombre", "tipo", "descripcion", "presupuesto", "ubicacion", "fotos", "estado", "trabajadorAsignado", "createdAt", "evidenciaAntes", "evidenciaDurante", "evidenciaDespues", "evidenciaNota", "correcciones", "correccionesCount") SELECT "id", "clienteUsername", "clienteNombre", "tipo", "descripcion", "presupuesto", "ubicacion", "fotos", "estado", "trabajadorAsignado", "createdAt", "evidenciaAntes", "evidenciaDurante", "evidenciaDespues", "evidenciaNota", "correcciones", "correccionesCount" FROM "solicitudes"`);
        await queryRunner.query(`DROP TABLE "solicitudes"`);
        await queryRunner.query(`ALTER TABLE "temporary_solicitudes" RENAME TO "solicitudes"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "solicitudes" RENAME TO "temporary_solicitudes"`);
        await queryRunner.query(`CREATE TABLE "solicitudes" ("id" varchar PRIMARY KEY NOT NULL, "clienteUsername" varchar NOT NULL, "clienteNombre" varchar NOT NULL, "tipo" varchar NOT NULL, "descripcion" text NOT NULL, "presupuesto" integer NOT NULL, "ubicacion" varchar NOT NULL, "fotos" text NOT NULL DEFAULT ('[]'), "estado" varchar NOT NULL DEFAULT ('borrador'), "trabajadorAsignado" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "evidenciaAntes" text NOT NULL DEFAULT ('[]'), "evidenciaDurante" text NOT NULL DEFAULT ('[]'), "evidenciaDespues" text NOT NULL DEFAULT ('[]'), "evidenciaNota" text, "correcciones" text NOT NULL DEFAULT ('[]'), "correccionesCount" integer NOT NULL DEFAULT (0))`);
        await queryRunner.query(`INSERT INTO "solicitudes"("id", "clienteUsername", "clienteNombre", "tipo", "descripcion", "presupuesto", "ubicacion", "fotos", "estado", "trabajadorAsignado", "createdAt", "evidenciaAntes", "evidenciaDurante", "evidenciaDespues", "evidenciaNota", "correcciones", "correccionesCount") SELECT "id", "clienteUsername", "clienteNombre", "tipo", "descripcion", "presupuesto", "ubicacion", "fotos", "estado", "trabajadorAsignado", "createdAt", "evidenciaAntes", "evidenciaDurante", "evidenciaDespues", "evidenciaNota", "correcciones", "correccionesCount" FROM "temporary_solicitudes"`);
        await queryRunner.query(`DROP TABLE "temporary_solicitudes"`);
    }

}
