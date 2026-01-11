const { supabase } = require('../config/db');
require('dotenv').config();

const newDocuments = [
  {
    document_name: 'Certificate of Registration',
    document_code: 'COR',
    base_price: 50.00,
    price_per_copy: 0.00,
    processing_days: 1
  },
  {
    document_name: 'Certificate of Grades',
    document_code: 'COG',
    base_price: 15.00,
    price_per_copy: 0.00,
    processing_days: 1
  },
  {
    document_name: 'Certificate of Enrollment',
    document_code: 'COE',
    base_price: 15.00,
    price_per_copy: 0.00,
    processing_days: 1
  },
  {
    document_name: 'Certificate of Graduation',
    document_code: 'COG2',
    base_price: 15.00,
    price_per_copy: 0.00,
    processing_days: 5
  },
  {
    document_name: 'Certificate of GWA',
    document_code: 'COGWA',
    base_price: 15.00,
    price_per_copy: 0.00,
    processing_days: 5
  },
  {
    document_name: 'Certificate of English as Medium of Instruction',
    document_code: 'COEMI',
    base_price: 15.00,
    price_per_copy: 0.00,
    processing_days: 5
  },
  {
    document_name: 'Transcript of Records',
    document_code: 'TOR',
    base_price: 50.00,
    price_per_copy: 0.00,
    processing_days: 12
  },
  {
    document_name: 'Honorable Dismissal',
    document_code: 'HD',
    base_price: 20.00,
    price_per_copy: 0.00,
    processing_days: 12
  },
  {
    document_name: 'Transcript of Records - For Board Examination',
    document_code: 'TOR_BE',
    base_price: 100.00,
    price_per_copy: 0.00,
    processing_days: 12
  }
];

async function updateDocuments() {
  try {
    console.log('Starting document update...');

    // Delete all related requests first (to handle foreign keys)
    console.log('Removing related requests...');
    const { error: deleteRequestsError } = await supabase
      .from('requests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteRequestsError) {
      console.error('Error deleting requests:', deleteRequestsError);
      return;
    }

    console.log('✓ Deleted related requests');

    // Delete all existing templates
    console.log('Removing existing documents...');
    const { error: deleteError } = await supabase
      .from('document_templates')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Error deleting templates:', deleteError);
      return;
    }

    console.log('✓ Deleted existing documents');

    // Insert new templates
    console.log('Inserting new documents...');
    const { data, error: insertError } = await supabase
      .from('document_templates')
      .insert(newDocuments.map(doc => ({
        ...doc,
        is_active: true,
        is_deleted: false,
        version: 1,
        field_config: {},
        template_file_path: '/templates/default.pdf'
      })))
      .select();

    if (insertError) {
      console.error('Error inserting templates:', insertError);
      return;
    }

    console.log(`✓ Successfully inserted ${data.length} documents`);
    console.log('\nNew documents:');
    data.forEach(doc => {
      console.log(`  - ${doc.document_name}: ₱${doc.base_price} (${doc.processing_days} days)`);
    });

    console.log('\n✅ Document update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

updateDocuments();
