import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('ChatMessages', (table) => {
        // 1 = thumbs up, -1 = thumbs down, NULL = no feedback
        table.smallint('feedback').nullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('ChatMessages', (table) => {
        table.dropColumn('feedback');
    });
}
