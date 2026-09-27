import { MigrationInterface, QueryRunner } from "typeorm";

export class FilesTable1787007990941 implements MigrationInterface {
    name = 'FilesTable1787007990941'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "files" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "path" varchar NOT NULL, "object" varchar NOT NULL, "objectId" varchar NOT NULL, "disk" varchar NOT NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "files"`);
    }

}
