/**
 * Migration: Remove Review Gating - Consolidate Review URLs & Add SMS Tone
 * Purpose: Implement Google-compliant direct-to-review flow
 * Date: 2025-12-02
 *
 * Changes:
 * - Add reviewUrl field (consolidates googleReviewLink + facebookLink)
 * - Add smsMessageTone field (friendly/professional/grateful)
 * - Migrate existing Google/Facebook URLs to reviewUrl
 * - Update Review.redirectedTo enum to support more platforms
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    console.log('📋 Starting migration: Remove review gating...');

    // 1. Add reviewUrl field (unified review platform URL)
    await queryInterface.addColumn('users', 'review_url', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Universal review platform URL (Google/Yelp/Facebook/TripAdvisor/etc)'
    });
    console.log('✓ Added review_url column');

    // 2. Add smsMessageTone field
    await queryInterface.addColumn('users', 'sms_message_tone', {
      type: DataTypes.ENUM('friendly', 'professional', 'grateful'),
      defaultValue: 'friendly',
      allowNull: false,
      comment: 'SMS message tone preference'
    });
    console.log('✓ Added sms_message_tone column');

    // 3. Migrate existing Google URLs to reviewUrl (priority #1)
    const googleMigrated = await queryInterface.sequelize.query(`
      UPDATE users
      SET review_url = google_review_link
      WHERE google_review_link IS NOT NULL
        AND google_review_link != ''
        AND TRIM(google_review_link) != '';
    `);
    console.log(`✓ Migrated ${googleMigrated[1]} Google review URLs`);

    // 4. Migrate existing Facebook URLs to reviewUrl (fallback, only if no Google URL)
    const facebookMigrated = await queryInterface.sequelize.query(`
      UPDATE users
      SET review_url = facebook_link
      WHERE (review_url IS NULL OR review_url = '' OR TRIM(review_url) = '')
        AND facebook_link IS NOT NULL
        AND facebook_link != ''
        AND TRIM(facebook_link) != '';
    `);
    console.log(`✓ Migrated ${facebookMigrated[1]} Facebook review URLs`);

    // 5. Update Review.redirectedTo enum to support more platforms
    // Note: PostgreSQL doesn't allow modifying enums directly, so we add new values
    try {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_reviews_redirected_to" ADD VALUE IF NOT EXISTS 'yelp';
      `);
      console.log('✓ Added "yelp" to redirectedTo enum');
    } catch (err) {
      console.log('  ℹ️ "yelp" already exists in enum');
    }

    try {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_reviews_redirected_to" ADD VALUE IF NOT EXISTS 'tripadvisor';
      `);
      console.log('✓ Added "tripadvisor" to redirectedTo enum');
    } catch (err) {
      console.log('  ℹ️ "tripadvisor" already exists in enum');
    }

    try {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_reviews_redirected_to" ADD VALUE IF NOT EXISTS 'custom';
      `);
      console.log('✓ Added "custom" to redirectedTo enum');
    } catch (err) {
      console.log('  ℹ️ "custom" already exists in enum');
    }

    // 6. Summary
    const stats = await queryInterface.sequelize.query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(review_url) as users_with_review_url,
        COUNT(CASE WHEN sms_message_tone = 'friendly' THEN 1 END) as friendly_tone
      FROM users;
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('\n📊 Migration Summary:');
    console.log(`   Total users: ${stats[0].total_users}`);
    console.log(`   Users with review URL: ${stats[0].users_with_review_url}`);
    console.log(`   Users with friendly tone: ${stats[0].friendly_tone}`);
    console.log('\n✅ Migration complete: Review gating removed!\n');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('⏮️  Rolling back migration: Remove review gating...');

    // Remove new columns
    await queryInterface.removeColumn('users', 'sms_message_tone');
    console.log('✓ Removed sms_message_tone column');

    await queryInterface.removeColumn('users', 'review_url');
    console.log('✓ Removed review_url column');

    // Note: Cannot remove enum values in PostgreSQL easily
    // They will remain but unused after rollback

    console.log('✅ Migration rolled back successfully\n');
  }
};
