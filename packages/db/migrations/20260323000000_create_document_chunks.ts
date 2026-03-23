import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.raw('CREATE EXTENSION IF NOT EXISTS vector');

    await knex.schema.createTable('DocumentChunks', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('document_id').notNullable().references('id').inTable('Documents').onDelete('CASCADE');
        table.uuid('user_id').notNullable().references('id').inTable('Users').onDelete('CASCADE');
        table.integer('chunk_index').notNullable();
        table.integer('page_number');
        table.text('content').notNullable();
        table.integer('token_count');
        table.jsonb('metadata');
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.unique(['document_id', 'chunk_index']);
    });
    // workaround since column is not supported by Knex schema builder
    await knex.schema.raw('ALTER TABLE "DocumentChunks" ADD COLUMN embedding vector(1536)');

    await knex.schema.raw('CREATE INDEX DocumentChunks_document_id_idx ON "DocumentChunks"(document_id)');
    await knex.schema.raw('CREATE INDEX DocumentChunks_user_id_idx ON "DocumentChunks"(user_id)');
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('DocumentChunks');
}
