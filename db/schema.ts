import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{
 id:text('id').primaryKey(),runnerToken:text('runner_token'),corpToken:text('corp_token'),runnerName:text('runner_name'),corpName:text('corp_name'),state:text('state').notNull(),version:integer('version').notNull().default(0),lastRequest:text('last_request'),createdAt:integer('created_at').notNull(),updatedAt:integer('updated_at').notNull()
});
