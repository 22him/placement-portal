// Skill keyword lists per target role. Used by the rule-based part of the resume score
// and for default skill-gap analysis. Admins/students can extend by editing this file.
export const ROLE_SKILLS = {
  'Software Developer': ['javascript', 'python', 'java', 'c++', 'data structures', 'algorithms', 'sql', 'git', 'rest api', 'oop', 'problem solving', 'testing'],
  'Full Stack Developer': ['react', 'node.js', 'express', 'mongodb', 'javascript', 'html', 'css', 'rest api', 'git', 'sql', 'typescript', 'docker'],
  'Data Analyst': ['sql', 'python', 'excel', 'pandas', 'numpy', 'power bi', 'tableau', 'statistics', 'data visualization', 'etl'],
  'Data Scientist': ['python', 'machine learning', 'pandas', 'numpy', 'scikit-learn', 'statistics', 'sql', 'deep learning', 'tensorflow', 'data visualization'],
  'DevOps Engineer': ['linux', 'docker', 'kubernetes', 'ci/cd', 'aws', 'git', 'bash', 'terraform', 'jenkins', 'monitoring'],
  'Frontend Developer': ['react', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'responsive design', 'git', 'redux', 'testing'],
  'Backend Developer': ['node.js', 'java', 'python', 'sql', 'mongodb', 'rest api', 'docker', 'git', 'system design', 'authentication'],
  'QA / Test Engineer': ['selenium', 'test cases', 'manual testing', 'automation', 'java', 'python', 'jira', 'api testing', 'sql', 'ci/cd'],
};

export const SOFT_SKILLS = ['leadership', 'communication', 'teamwork', 'problem solving', 'time management', 'adaptability', 'collaboration', 'presentation', 'creativity', 'critical thinking'];

export const ROLES = Object.keys(ROLE_SKILLS);
