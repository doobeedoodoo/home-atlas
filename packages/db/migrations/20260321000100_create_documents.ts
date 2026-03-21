import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('Documents', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('Users').onDelete('CASCADE');
        table.text('name').notNullable();
        table.text('r2_key').unique(); // null for URL-sourced docs
        table.text('source_url');
        table.bigInteger('file_size_bytes'); // null for URL-sourced docs
        table.text('mime_type').notNullable().defaultTo('application/pdf');
        table.text('status').notNullable().defaultTo('pending')
            .checkIn(['pending', 'processing', 'ready', 'failed']);
        table.text('error_message');
        table.integer('page_count');
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });

    await knex.schema.raw('CREATE INDEX documents_user_id_idx ON "Documents"(user_id)');
    await knex.schema.raw('CREATE INDEX documents_status_idx ON "Documents"(status)');
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('Documents');
}
