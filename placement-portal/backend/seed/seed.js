import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);





import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Company from '../models/Company.js';
import PlacementDrive from '../models/PlacementDrive.js';
import JobApplication from '../models/JobApplication.js';
import CodingQuestion from '../models/CodingQuestion.js';
import AptitudeTest from '../models/AptitudeTest.js';
import Resume from '../models/Resume.js';
import CodingSubmission from '../models/CodingSubmission.js';
import TestResult from '../models/TestResult.js';
import InterviewSession from '../models/InterviewSession.js';
import LearningRoadmap from '../models/LearningRoadmap.js';

const day = (n) => new Date(Date.now() + n * 86400000);
const q = (text, options, correctIndex, topic, explanation) => ({ text, options, correctIndex, topic, explanation });

const quant = [
  q('What is 20% of 250?', ['40', '50', '60', '45'], 1, 'Percentages', '250 × 20/100 = 50.'),
  q('A can finish a job in 10 days and B in 15 days. Working together, how many days do they need?', ['5', '6', '7', '8'], 1, 'Time & Work', 'Rate = 1/10 + 1/15 = 1/6, so 6 days.'),
  q('An item bought for ₹400 is sold for ₹500. What is the profit percentage?', ['20%', '25%', '30%', '15%'], 1, 'Profit & Loss', 'Profit 100 / CP 400 = 25%.'),
  q('What is the average of 10, 20, 30, 40 and 50?', ['25', '30', '35', '40'], 1, 'Averages', 'Sum 150 / 5 = 30.'),
  q('Two numbers are in the ratio 3:5 and sum to 64. What is the larger number?', ['24', '32', '40', '44'], 2, 'Ratio', '64 × 5/8 = 40.'),
  q('A 120 m long train crosses a pole in 6 seconds. What is its speed in km/h?', ['60', '72', '80', '90'], 1, 'Speed & Distance', '120/6 = 20 m/s = 72 km/h.'),
];
const logical = [
  q('Find the next number: 2, 6, 12, 20, 30, ?', ['40', '42', '44', '36'], 1, 'Number Series', 'Differences are 4, 6, 8, 10, 12, so 30 + 12 = 42.'),
  q('Which one does not belong: Apple, Banana, Carrot, Mango?', ['Apple', 'Banana', 'Carrot', 'Mango'], 2, 'Classification', 'Carrot is a vegetable; others are fruits.'),
  q('If CAT is coded as 24 (3+1+20), what is DOG?', ['24', '26', '28', '30'], 1, 'Coding-Decoding', 'D=4, O=15, G=7; total 26.'),
  q('Pointing to a man, a woman says, "His mother is the only daughter of my mother." How is the woman related to the man?', ['Sister', 'Mother', 'Aunt', 'Daughter'], 1, 'Blood Relations', 'The only daughter of the woman’s mother is the woman herself, so she is his mother.'),
  q('A person walks 5 km north, 3 km east, then 5 km south. How far is he from the start?', ['3 km', '5 km', '8 km', '13 km'], 0, 'Directions', 'North and south cancel; 3 km east remains.'),
  q('Find the next letter: A, C, F, J, O, ?', ['T', 'U', 'V', 'S'], 1, 'Letter Series', 'Gaps are +2, +3, +4, +5, +6: O(15) + 6 = U.'),
];
const verbal = [
  q('Choose the synonym of "abundant".', ['Scarce', 'Plentiful', 'Rare', 'Tiny'], 1, 'Vocabulary', 'Abundant means existing in large quantities.'),
  q('Choose the antonym of "brave".', ['Cowardly', 'Bold', 'Fearless', 'Heroic'], 0, 'Vocabulary', 'Cowardly is the opposite of brave.'),
  q('Fill in the blank: "She ___ to the market yesterday."', ['go', 'goes', 'went', 'going'], 2, 'Grammar', '"Yesterday" needs the simple past: went.'),
  q('Choose the correctly spelled word.', ['Accomodate', 'Accommodate', 'Acommodate', 'Acomodate'], 1, 'Spelling', 'Accommodate has double c and double m.'),
  q('What does the idiom "break the ice" mean?', ['Start a conversation in a social setting', 'Destroy something', 'Feel cold', 'Stop a fight'], 0, 'Idioms', 'It means easing initial social tension.'),
  q('One word for "a person who loves books":', ['Bibliophile', 'Philatelist', 'Numismatist', 'Cartographer'], 0, 'One Word Substitution', 'A bibliophile loves books.'),
];

const coding = [
  ['Two Sum', 'Given an array and a target, return indices of two numbers that add up to the target.', 'Easy', 'Arrays', 'two-sum', ['Use a hash map of value → index.']],
  ['Best Time to Buy and Sell Stock', 'Given daily prices, find the maximum profit from one buy and one later sell.', 'Easy', 'Arrays', 'best-time-to-buy-and-sell-stock', ['Track the minimum price so far.']],
  ['Maximum Subarray', 'Find the contiguous subarray with the largest sum.', 'Medium', 'Arrays', 'maximum-subarray', ["Kadane's algorithm."]],
  ['Merge Intervals', 'Merge all overlapping intervals in a list.', 'Medium', 'Arrays', 'merge-intervals', ['Sort by start time first.']],
  ['Valid Anagram', 'Check whether two strings are anagrams of each other.', 'Easy', 'Strings', 'valid-anagram', ['Count character frequencies.']],
  ['Longest Substring Without Repeating Characters', 'Find the length of the longest substring with all distinct characters.', 'Medium', 'Strings', 'longest-substring-without-repeating-characters', ['Sliding window with a set or map.']],
  ['Valid Parentheses', 'Determine whether a string of brackets is correctly balanced.', 'Easy', 'Stack & Queue', 'valid-parentheses', ['Use a stack.']],
  ['Reverse Linked List', 'Reverse a singly linked list.', 'Easy', 'Linked List', 'reverse-linked-list', ['Iterate with prev/curr/next pointers.']],
  ['Merge Two Sorted Lists', 'Merge two sorted linked lists into one sorted list.', 'Easy', 'Linked List', 'merge-two-sorted-lists', ['Use a dummy head node.']],
  ['Binary Search', 'Search for a target in a sorted array in O(log n).', 'Easy', 'Searching & Sorting', 'binary-search', ['Maintain low/high pointers.']],
  ['Maximum Depth of Binary Tree', 'Return the depth of a binary tree.', 'Easy', 'Trees', 'maximum-depth-of-binary-tree', ['Recursion: 1 + max(left, right).']],
  ['Validate Binary Search Tree', 'Check whether a binary tree is a valid BST.', 'Medium', 'Trees', 'validate-binary-search-tree', ['Pass min/max bounds down the recursion.']],
  ['Climbing Stairs', 'Count the distinct ways to climb n stairs taking 1 or 2 steps.', 'Easy', 'Dynamic Programming', 'climbing-stairs', ['It is a Fibonacci recurrence.']],
  ['Coin Change', 'Find the fewest coins needed to make a given amount.', 'Medium', 'Dynamic Programming', 'coin-change', ['Bottom-up DP over amounts.']],
  ['Longest Increasing Subsequence', 'Find the length of the longest strictly increasing subsequence.', 'Medium', 'Dynamic Programming', 'longest-increasing-subsequence', ['O(n²) DP, or binary search for O(n log n).']],
  ['Number of Islands', 'Count connected groups of land cells in a grid.', 'Medium', 'Graphs', 'number-of-islands', ['DFS/BFS flood fill.']],
  ['Course Schedule', 'Decide whether all courses can be finished given prerequisites.', 'Medium', 'Graphs', 'course-schedule', ['Detect a cycle with topological sort.']],
  ['Trapping Rain Water', 'Compute how much rain water an elevation map can trap.', 'Hard', 'Arrays', 'trapping-rain-water', ['Two pointers with left/right max.']],
].map(([title, description, difficulty, topic, slug, hints]) => ({ title, description, difficulty, topic, hints, link: `https://leetcode.com/problems/${slug}/` }));

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User, StudentProfile, Company, PlacementDrive, JobApplication, CodingQuestion, AptitudeTest, Resume, CodingSubmission, TestResult, InterviewSession, LearningRoadmap].map((m) => m.deleteMany({})));

  await User.create({ name: 'Placement Officer', email: 'admin@college.edu', password: 'Admin@1234', role: 'admin' });

  const studentData = [
    ['Aarav Sharma', 'aarav@college.edu', 'CSE', 4, 8.4, 0, ['javascript', 'react', 'node.js', 'mongodb', 'git', 'html', 'css'], '21CS001'],
    ['Priya Patel', 'priya@college.edu', 'IT', 4, 7.6, 0, ['python', 'sql', 'pandas', 'excel', 'statistics'], '21IT014'],
    ['Rohan Verma', 'rohan@college.edu', 'CSE', 4, 6.4, 1, ['java', 'c++', 'data structures'], '21CS047'],
    ['Sneha Gupta', 'sneha@college.edu', 'ECE', 4, 8.9, 0, ['python', 'c++', 'linux', 'docker', 'git'], '21EC022'],
    ['Kabir Singh', 'kabir@college.edu', 'CSE', 3, 7.1, 0, ['java', 'sql', 'git'], '22CS031'],
  ];
  const students = [];
  for (const [name, email, branch, year, cgpa, backlogs, skills, rollNo] of studentData) {
    const u = await User.create({ name, email, password: 'Student@1234', role: 'student' });
    await StudentProfile.create({ user: u._id, rollNo, branch, year, cgpa, backlogs, skills, targetRoles: ['Software Developer'] });
    students.push(u);
  }

  const companies = await Company.insertMany([
    { name: 'TechNova Solutions', industry: 'Software Services', location: 'Bengaluru', packageLPA: 8, roles: ['Software Developer'], requiredSkills: ['java', 'data structures', 'sql', 'git'], minCgpa: 7, maxBacklogs: 0, allowedBranches: ['CSE', 'IT', 'ECE'], description: 'Mid-size IT services firm building enterprise software.', website: 'https://example.com/technova' },
    { name: 'DataBridge Analytics', industry: 'Analytics', location: 'Hyderabad', packageLPA: 9, roles: ['Data Analyst'], requiredSkills: ['sql', 'python', 'pandas', 'statistics', 'excel'], minCgpa: 7.5, maxBacklogs: 0, allowedBranches: ['CSE', 'IT'], description: 'Analytics consultancy for retail and banking clients.', website: 'https://example.com/databridge' },
    { name: 'CloudPeak Systems', industry: 'Cloud & DevOps', location: 'Pune', packageLPA: 12, roles: ['DevOps Engineer'], requiredSkills: ['linux', 'docker', 'git', 'python'], minCgpa: 7.5, maxBacklogs: 0, allowedBranches: ['CSE', 'IT', 'ECE'], description: 'Cloud infrastructure and managed DevOps services.', website: 'https://example.com/cloudpeak' },
    { name: 'FinServe Labs', industry: 'FinTech', location: 'Mumbai', packageLPA: 14, roles: ['Backend Developer'], requiredSkills: ['java', 'sql', 'data structures', 'rest api'], minCgpa: 8, maxBacklogs: 0, allowedBranches: ['CSE', 'IT'], description: 'Payments platform team hiring backend engineers.', website: 'https://example.com/finserve' },
    { name: 'Innovate Soft', industry: 'Product', location: 'Noida', packageLPA: 7, roles: ['Full Stack Developer'], requiredSkills: ['react', 'node.js', 'mongodb', 'javascript'], minCgpa: 6.5, maxBacklogs: 1, allowedBranches: ['CSE', 'IT', 'ECE'], description: 'Product startup building SaaS tools for small businesses.', website: 'https://example.com/innovatesoft' },
    { name: 'GreenByte Technologies', industry: 'Embedded & IoT', location: 'Chennai', packageLPA: 6.5, roles: ['Software Developer'], requiredSkills: ['c++', 'python', 'linux'], minCgpa: 6, maxBacklogs: 1, allowedBranches: ['ECE', 'CSE'], description: 'IoT and embedded software company.', website: 'https://example.com/greenbyte' },
  ]);
  const byName = Object.fromEntries(companies.map((c) => [c.name, c]));

  const mk = (c, title, role, d, dl, extra = {}) => ({ company: c._id, title, role, driveDate: day(d), deadline: day(dl), minCgpa: c.minCgpa, maxBacklogs: c.maxBacklogs, allowedBranches: c.allowedBranches, requiredSkills: c.requiredSkills, ctcLPA: c.packageLPA, status: 'upcoming', jobDescription: `${role} at ${c.name}. ${c.description} Responsibilities include building features, writing tests and collaborating with the team.`, ...extra });
  const drives = await PlacementDrive.insertMany([
    mk(byName['TechNova Solutions'], 'TechNova Campus Drive 2026', 'Software Developer', 12, 8),
    mk(byName['DataBridge Analytics'], 'DataBridge Analyst Hiring', 'Data Analyst', 18, 14),
    mk(byName['CloudPeak Systems'], 'CloudPeak DevOps Drive', 'DevOps Engineer', 25, 20),
    mk(byName['FinServe Labs'], 'FinServe Backend Engineers', 'Backend Developer', 30, 26),
    mk(byName['Innovate Soft'], 'Innovate Soft Full Stack Drive', 'Full Stack Developer', 9, 6),
    mk(byName['GreenByte Technologies'], 'GreenByte Software Drive (completed)', 'Software Developer', -20, -25, { status: 'completed' }),
  ]);

  await JobApplication.insertMany([
    { student: students[0]._id, drive: drives[4]._id, status: 'applied' },
    { student: students[0]._id, drive: drives[0]._id, status: 'shortlisted' },
    { student: students[3]._id, drive: drives[5]._id, status: 'selected' },
    { student: students[2]._id, drive: drives[5]._id, status: 'rejected' },
    { student: students[1]._id, drive: drives[1]._id, status: 'applied' },
  ]);
  await StudentProfile.updateOne({ user: students[3]._id }, { placed: true });

  await CodingQuestion.insertMany(coding);
  await AptitudeTest.insertMany([
    { title: 'Quantitative Basics', category: 'Quantitative', topic: 'Mixed Quant', type: 'practice', durationMins: 10, questions: quant },
    { title: 'Logical Reasoning Basics', category: 'Logical', topic: 'Mixed Logical', type: 'practice', durationMins: 10, questions: logical },
    { title: 'Verbal Ability Basics', category: 'Verbal', topic: 'Mixed Verbal', type: 'practice', durationMins: 8, questions: verbal },
    { title: 'Placement Mock Test 1', category: 'Mixed', topic: 'Full mock', type: 'mock', durationMins: 20, questions: [...quant.slice(0, 3), ...logical.slice(0, 3), ...verbal.slice(0, 3)] },
  ]);

  console.log('Seed complete.\n');
  console.log('Admin   : admin@college.edu  / Admin@1234');
  console.log('Students: aarav@college.edu, priya@college.edu, rohan@college.edu, sneha@college.edu, kabir@college.edu  / Student@1234');
  console.log('\nNote: seeded students have no resumes, test results or interview sessions on purpose; analytics fill up from real usage.');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
