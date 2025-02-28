import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1740749720422 implements MigrationInterface {
  name = 'InitialMigration1740749720422';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`password\` varchar(255) NOT NULL,
        \`role\` enum('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
        \`access_token\` varchar(255) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Create initial admin user with the new hash
    await queryRunner.query(`
      INSERT INTO users (id, name, email, password, role)
      VALUES (
        UUID(),
        'Admin User',
        'admin@example.com',
        '$2b$10$bpEv67j2f.wsBfXK9b4WI.ZSz18Ukr20kcULl8nNQ0.yL9mAL2eB.', -- password: admin123
        'ADMIN'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`users\``);
  }
}
