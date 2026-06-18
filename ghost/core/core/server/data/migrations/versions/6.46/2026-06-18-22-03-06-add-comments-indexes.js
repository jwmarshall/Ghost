const {createNonTransactionalMigration} = require('../../utils');
const {addIndex, dropIndex} = require('../../../schema/commands');

// Indexes for the admin "all comments" moderation page (getAdminAllComments).
// The page orders by created_at and counts replies per comment; these indexes serve:
//  - created_at: avoids a filesort over every comment for the ORDER BY list
//  - status: the COUNT(DISTINCT id) pagination count (narrow secondary index
//    instead of a clustered scan over the html longtext column)
//  - (in_reply_to_id, status): the batched direct_replies grouped query on in_reply_to_id
//  - (parent_id, in_reply_to_id, status): the batched replies / direct_replies grouped
//    queries on parent_id (the latter also filters in_reply_to_id IS NULL)
//
// All four are purely additive. parent_id and in_reply_to_id keep their own foreign-key
// indexes, so no FK index needs to be re-added before dropping these on `down`.
module.exports = createNonTransactionalMigration(
    async function up(knex) {
        await addIndex('comments', ['created_at'], knex);
        await addIndex('comments', ['status'], knex);
        await addIndex('comments', ['in_reply_to_id', 'status'], knex);
        await addIndex('comments', ['parent_id', 'in_reply_to_id', 'status'], knex);
    },
    async function down(knex) {
        await dropIndex('comments', ['parent_id', 'in_reply_to_id', 'status'], knex);
        await dropIndex('comments', ['in_reply_to_id', 'status'], knex);
        await dropIndex('comments', ['status'], knex);
        await dropIndex('comments', ['created_at'], knex);
    }
);
