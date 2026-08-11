export const STUDENT_TYPES = [
  { value: 'secondary_school', label: 'Secondary School', description: 'JSS/SS student preparing for WAEC/NECO' },
  { value: 'university', label: 'University', description: 'Undergraduate student' },
  { value: 'polytechnic', label: 'Polytechnic', description: 'ND/HND student' },
  { value: 'utme_aspirant', label: 'UTME Aspirant', description: 'Preparing for JAMB' },
];

export const SUBJECTS_BY_TYPE = {
  secondary_school: [
    'English Language', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Economics', 'Government', 'Literature in English', 'Geography',
    'Further Mathematics', 'Agricultural Science', 'Commerce',
  ],
  utme_aspirant: [
    'English Language', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Economics', 'Government', 'Literature in English', 'Geography',
    'Christian Religious Studies', 'Islamic Religious Studies', 'Commerce',
  ],
  university: [
    'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Economics',
    'Accounting', 'Business Administration', 'English', 'Statistics',
  ],
  polytechnic: [
    'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Accounting',
    'Business Administration', 'Engineering Technology', 'Statistics',
  ],
};

export const ACADEMIC_LEVELS_BY_TYPE = {
  secondary_school: ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'],
  utme_aspirant: ['First-time candidate', 'Retaking JAMB'],
  university: ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level'],
  polytechnic: ['ND1', 'ND2', 'HND1', 'HND2'],
};
