import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFechaInicioToOferta1786231806987 implements MigrationInterface {
    name = 'AddFechaInicioToOferta1786231806987'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_ofertas" ("id" varchar PRIMARY KEY NOT NULL, "solicitudId" varchar NOT NULL, "trabajadorUsername" varchar NOT NULL, "precio" integer NOT NULL, "tiempoEstimadoDias" integer, "mensaje" text NOT NULL, "estado" varchar NOT NULL DEFAULT ('pendiente'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "fechaInicio" date, CONSTRAINT "FK_b89436df81ede6ef4c99e3b3557" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_ofertas"("id", "solicitudId", "trabajadorUsername", "precio", "tiempoEstimadoDias", "mensaje", "estado", "createdAt") SELECT "id", "solicitudId", "trabajadorUsername", "precio", "tiempoEstimadoDias", "mensaje", "estado", "createdAt" FROM "ofertas"`);
        await queryRunner.query(`DROP TABLE "ofertas"`);
        await queryRunner.query(`ALTER TABLE "temporary_ofertas" RENAME TO "ofertas"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ofertas" RENAME TO "temporary_ofertas"`);
        await queryRunner.query(`CREATE TABLE "ofertas" ("id" varchar PRIMARY KEY NOT NULL, "solicitudId" varchar NOT NULL, "trabajadorUsername" varchar NOT NULL, "precio" integer NOT NULL, "tiempoEstimadoDias" integer, "mensaje" text NOT NULL, "estado" varchar NOT NULL DEFAULT ('pendiente'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_b89436df81ede6ef4c99e3b3557" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "ofertas"("id", "solicitudId", "trabajadorUsername", "precio", "tiempoEstimadoDias", "mensaje", "estado", "createdAt") SELECT "id", "solicitudId", "trabajadorUsername", "precio", "tiempoEstimadoDias", "mensaje", "estado", "createdAt" FROM "temporary_ofertas"`);
        await queryRunner.query(`DROP TABLE "temporary_ofertas"`);
    }

}
