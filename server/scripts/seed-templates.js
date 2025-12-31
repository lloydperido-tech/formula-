const db = require('../config/db');

async function seedTemplates() {
  console.log('Seeding document templates...');

  const templates = [
    {
      document_name: 'Transcript of Records',
      document_code: 'TOR',
      template_file_path: 'uploads/templates/tor-template.pdf',
      field_config: {
        predefined: ['student_name', 'student_number', 'program', 'purpose', 'quantity'],
        custom: ['graduation_year', 'cum_laude']
      },
      base_price: 150.00,
      price_per_copy: 50.00,
      processing_days: 7,
      is_active: true
    },
    {
      document_name: 'Certificate of Grades',
      document_code: 'COG',
      template_file_path: 'uploads/templates/cog-template.pdf',
      field_config: {
        predefined: ['student_name', 'student_number', 'program', 'purpose', 'quantity'],
        custom: ['semester', 'school_year']
      },
      base_price: 50.00,
      price_per_copy: 10.00,
      processing_days: 3,
      is_active: true
    },
    {
      document_name: 'Certificate of Good Moral',
      document_code: 'CGM',
      template_file_path: 'uploads/templates/cgm-template.pdf',
      field_config: {
        predefined: ['student_name', 'student_number', 'program', 'purpose'],
        custom: []
      },
      base_price: 50.00,
      price_per_copy: 0.00,
      processing_days: 3,
      is_active: true
    },
    {
      document_name: 'Certificate of Enrollment',
      document_code: 'COE',
      template_file_path: 'uploads/templates/coe-template.pdf',
      field_config: {
        predefined: ['student_name', 'student_number', 'program', 'purpose'],
        custom: ['semester', 'school_year']
      },
      base_price: 30.00,
      price_per_copy: 0.00,
      processing_days: 1,
      is_active: true
    },
    {
      document_name: 'Honorable Dismissal',
      document_code: 'HD',
      template_file_path: 'uploads/templates/hd-template.pdf',
      field_config: {
        predefined: ['student_name', 'student_number', 'program', 'purpose'],
        custom: ['last_semester_attended']
      },
      base_price: 100.00,
      price_per_copy: 0.00,
      processing_days: 5,
      is_active: true
    },
    {
      document_name: 'Certificate of Registration',
      document_code: 'COR',
      template_file_path: 'uploads/templates/cor-template.pdf',
      field_config: {
        predefined: ['student_name', 'student_number', 'program', 'purpose'],
        custom: ['semester', 'school_year']
      },
      base_price: 30.00,
      price_per_copy: 0.00,
      processing_days: 1,
      is_active: true
    },
    {
      document_name: 'Diploma/Degree Certificate',
      document_code: 'DDC',
      template_file_path: 'uploads/templates/ddc-template.pdf',
      field_config: {
        predefined: ['student_name', 'student_number', 'program', 'purpose'],
        custom: ['graduation_date', 'degree']
      },
      base_price: 200.00,
      price_per_copy: 0.00,
      processing_days: 14,
      is_active: true
    },
    {
      document_name: 'Course Description',
      document_code: 'CD',
      template_file_path: 'uploads/templates/cd-template.pdf',
      field_config: {
        predefined: ['student_name', 'student_number', 'program', 'purpose', 'quantity'],
        custom: ['course_code', 'course_title']
      },
      base_price: 50.00,
      price_per_copy: 30.00,
      processing_days: 5,
      is_active: true
    },
    {
      document_name: 'Certification of Units Earned',
      document_code: 'CUE',
      template_file_path: 'uploads/templates/cue-template.pdf',
      field_config: {
        predefined: ['student_name', 'student_number', 'program', 'purpose'],
        custom: ['units_earned']
      },
      base_price: 50.00,
      price_per_copy: 0.00,
      processing_days: 3,
      is_active: true
    }
  ];

  try {
    // Check existing templates
    const { data: existing, error: fetchError } = await db.supabase
      .from('document_templates')
      .select('document_code');

    if (fetchError) {
      console.error('Error fetching existing templates:', fetchError);
      throw fetchError;
    }

    const existingCodes = new Set(existing.map(t => t.document_code));
    console.log('Existing templates:', existingCodes);

    // Filter out templates that already exist
    const templatesToInsert = templates.filter(t => !existingCodes.has(t.document_code));

    if (templatesToInsert.length === 0) {
      console.log('All templates already exist. No new templates to insert.');
      return;
    }

    console.log(`Inserting ${templatesToInsert.length} new templates...`);

    // Insert new templates
    const { data, error } = await db.supabase
      .from('document_templates')
      .insert(templatesToInsert)
      .select();

    if (error) {
      console.error('Error inserting templates:', error);
      throw error;
    }

    console.log(`Successfully inserted ${data.length} templates:`,);
    data.forEach(t => console.log(`  - ${t.document_name} (${t.document_code})`));

  } catch (error) {
    console.error('Error seeding templates:', error);
    process.exit(1);
  }
}

// Run the seeder
seedTemplates()
  .then(() => {
    console.log('Template seeding completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Template seeding failed:', error);
    process.exit(1);
  });
