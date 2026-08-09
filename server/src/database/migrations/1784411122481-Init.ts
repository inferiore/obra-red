import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1784411122481 implements MigrationInterface {
    name = 'Init1784411122481'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "username" varchar NOT NULL, "passwordHash" varchar NOT NULL, "name" varchar NOT NULL, "role" varchar NOT NULL, "email" varchar, "telefono" varchar, "documento" varchar, "tipoCliente" varchar, "razonSocial" varchar, "nit" varchar, "direccion" varchar, "barrio" varchar, "especialidad" varchar, "especialidadesExtra" text, "experiencia" integer, "descripcionProfesional" text, "zonasCobertura" text, "calificacion" float NOT NULL DEFAULT (5), "trabajosCompletados" integer NOT NULL DEFAULT (0), "verificado" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"))`);
        await queryRunner.query(`CREATE TABLE "solicitudes" ("id" varchar PRIMARY KEY NOT NULL, "clienteUsername" varchar NOT NULL, "clienteNombre" varchar NOT NULL, "tipo" varchar NOT NULL, "descripcion" text NOT NULL, "presupuesto" integer NOT NULL, "ubicacion" varchar NOT NULL, "fotos" text NOT NULL DEFAULT ('[]'), "estado" varchar NOT NULL DEFAULT ('borrador'), "trabajadorAsignado" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "ofertas" ("id" varchar PRIMARY KEY NOT NULL, "solicitudId" varchar NOT NULL, "trabajadorUsername" varchar NOT NULL, "precio" integer NOT NULL, "tiempoEstimadoDias" integer, "mensaje" text NOT NULL, "estado" varchar NOT NULL DEFAULT ('pendiente'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "temporary_ofertas" ("id" varchar PRIMARY KEY NOT NULL, "solicitudId" varchar NOT NULL, "trabajadorUsername" varchar NOT NULL, "precio" integer NOT NULL, "tiempoEstimadoDias" integer, "mensaje" text NOT NULL, "estado" varchar NOT NULL DEFAULT ('pendiente'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_b89436df81ede6ef4c99e3b3557" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_ofertas"("id", "solicitudId", "trabajadorUsername", "precio", "tiempoEstimadoDias", "mensaje", "estado", "createdAt") SELECT "id", "solicitudId", "trabajadorUsername", "precio", "tiempoEstimadoDias", "mensaje", "estado", "createdAt" FROM "ofertas"`);
        await queryRunner.query(`DROP TABLE "ofertas"`);
        await queryRunner.query(`ALTER TABLE "temporary_ofertas" RENAME TO "ofertas"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ofertas" RENAME TO "temporary_ofertas"`);
        await queryRunner.query(`CREATE TABLE "ofertas" ("id" varchar PRIMARY KEY NOT NULL, "solicitudId" varchar NOT NULL, "trabajadorUsername" varchar NOT NULL, "precio" integer NOT NULL, "tiempoEstimadoDias" integer, "mensaje" text NOT NULL, "estado" varchar NOT NULL DEFAULT ('pendiente'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "ofertas"("id", "solicitudId", "trabajadorUsername", "precio", "tiempoEstimadoDias", "mensaje", "estado", "createdAt") SELECT "id", "solicitudId", "trabajadorUsername", "precio", "tiempoEstimadoDias", "mensaje", "estado", "createdAt" FROM "temporary_ofertas"`);
        await queryRunner.query(`DROP TABLE "temporary_ofertas"`);
        await queryRunner.query(`DROP TABLE "ofertas"`);
        await queryRunner.query(`DROP TABLE "solicitudes"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
