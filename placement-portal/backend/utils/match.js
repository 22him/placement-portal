const norm = (s) => String(s || '').trim().toLowerCase();

// Rule-based eligibility + match score between a student profile and a set of criteria.
// criteria: { minCgpa, maxBacklogs, allowedBranches[], requiredSkills[] }
export function evaluateMatch(profile, criteria, extraSkills = []) {
  const p = profile || {};
  const studentSkills = new Set([...(p.skills || []), ...extraSkills].map(norm));
  const reqSkills = (criteria.requiredSkills || []).map(norm).filter(Boolean);
  const branches = (criteria.allowedBranches || []).map(norm).filter(Boolean);

  const missing = [];
  const reasons = [];

  const cgpaOk = (p.cgpa || 0) >= (criteria.minCgpa || 0);
  if (cgpaOk) reasons.push(`CGPA ${p.cgpa || 0} meets the minimum of ${criteria.minCgpa || 0}`);
  else missing.push(`CGPA ${criteria.minCgpa} required (you have ${p.cgpa || 0})`);

  const backlogsOk = (p.backlogs || 0) <= (criteria.maxBacklogs ?? 0);
  if (backlogsOk) reasons.push(`Backlogs (${p.backlogs || 0}) within the allowed ${criteria.maxBacklogs ?? 0}`);
  else missing.push(`At most ${criteria.maxBacklogs ?? 0} backlogs allowed (you have ${p.backlogs || 0})`);

  const branchOk = !branches.length || branches.includes(norm(p.branch));
  if (branchOk) reasons.push(branches.length ? `Your branch (${p.branch}) is eligible` : 'Open to all branches');
  else missing.push(`Open only to: ${criteria.allowedBranches.join(', ')}`);

  const matchedSkills = reqSkills.filter((s) => studentSkills.has(s));
  const missingSkills = reqSkills.filter((s) => !studentSkills.has(s));
  if (matchedSkills.length) reasons.push(`Matching skills: ${matchedSkills.join(', ')}`);

  const skillScore = reqSkills.length ? matchedSkills.length / reqSkills.length : 1;
  // Weights: skills 50, CGPA 20, branch 15, backlogs 15
  const cgpaScore = criteria.minCgpa ? Math.min((p.cgpa || 0) / criteria.minCgpa, 1) : 1;
  const matchPercent = Math.round(skillScore * 50 + cgpaScore * 20 + (branchOk ? 15 : 0) + (backlogsOk ? 15 : 0));

  return {
    eligible: cgpaOk && backlogsOk && branchOk,
    matchPercent,
    reasons,
    missingEligibility: missing,
    matchedSkills,
    missingSkills,
  };
}
