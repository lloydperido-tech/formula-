const { supabase } = require('../config/db');
require('dotenv').config();

const processingDaysUpdates = [
  { document_name: 'Certificate of Registration', processing_days: '1-2' },
  { document_name: 'Certificate of Grades', processing_days: '1-2' },
  { document_name: 'Certificate of Enrollment', processing_days: '1-2' },
  { document_name: 'Certificate of Graduation', processing_days: '4-7' },
  { document_name: 'Certificate of GWA', processing_days: '4-7' },
  { document_name: 'Certificate of English as Medium of Instruction', processing_days: '4-7' },
  { document_name: 'Transcript of Records', processing_days: '4-20' },
  { document_name: 'Honorable Dismissal', processing_days: '4-20' },
  { document_name: 'Transcript of Records - For Board Examination', processing_days: '4-20' }
];

async function updateProcessingDays() {
  try {
    console.log('Updating processing days...');

    for (const doc of processingDaysUpdates) {
      const { error } = await supabase
        .from('document_templates')
        .update({ processing_days: doc.processing_days })
        .eq('document_name', doc.document_name);

      if (error) {
        console.error(`Error updating ${doc.document_name}:`, error);
      } else {
        console.log(`✓ Updated ${doc.document_name} to ${doc.processing_days} days`);
      }
    }

    console.log('\n✅ All processing days updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

updateProcessingDays();
