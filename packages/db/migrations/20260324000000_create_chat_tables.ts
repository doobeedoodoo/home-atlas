import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('ChatSessions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('Users').onDelete('CASCADE');
        table.string('title', 255).notNullable().defaultTo('New conversation');
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });

    await knex.schema.raw('CREATE INDEX ChatSessions_user_id_idx ON "ChatSessions"(user_id)');

    await knex.schema.createTable('ChatMessages', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('session_id').notNullable().references('id').inTable('ChatSessions').onDelete('CASCADE');
        table.uuid('user_id').notNullable().references('id').inTable('Users').onDelete('CASCADE');
        table.enum('role', ['user', 'assistant']).notNullable();
        table.text('content').notNullable();
        table.jsonb('citations').notNullable().defaultTo('[]');
        table.string('langfuse_trace_id', 255);
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });

    await knex.schema.raw('CREATE INDEX ChatMessages_session_id_idx ON "ChatMessages"(session_id)');
    await knex.schema.raw('CREATE INDEX ChatMessages_user_id_idx ON "ChatMessages"(user_id)');
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('ChatMessages');
    await knex.schema.dropTable('ChatSessions');
}
