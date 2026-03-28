export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  title: string;
  difficulty: Difficulty;
  platform: 'LeetCode' | 'HackerRank';
  link: string;
  description: string;
}

export const QUESTIONS: Record<Difficulty, Question[]> = {
  easy: [
    { id: 'lc-1',   title: 'Two Sum',                        difficulty: 'easy', platform: 'LeetCode',   link: 'https://leetcode.com/problems/two-sum/',                              description: 'Given an array of integers and a target, return indices of the two numbers that add up to target.' },
    { id: 'lc-20',  title: 'Valid Parentheses',              difficulty: 'easy', platform: 'LeetCode',   link: 'https://leetcode.com/problems/valid-parentheses/',                    description: 'Given a string of brackets, determine if the input string is valid.' },
    { id: 'lc-21',  title: 'Merge Two Sorted Lists',         difficulty: 'easy', platform: 'LeetCode',   link: 'https://leetcode.com/problems/merge-two-sorted-lists/',               description: 'Merge two sorted linked lists and return the merged sorted list.' },
    { id: 'lc-70',  title: 'Climbing Stairs',                difficulty: 'easy', platform: 'LeetCode',   link: 'https://leetcode.com/problems/climbing-stairs/',                      description: 'You can climb 1 or 2 steps. How many distinct ways can you climb to the top?' },
    { id: 'lc-121', title: 'Best Time to Buy and Sell Stock',difficulty: 'easy', platform: 'LeetCode',   link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',      description: 'Find the maximum profit from a single buy and sell transaction.' },
    { id: 'lc-206', title: 'Reverse Linked List',            difficulty: 'easy', platform: 'LeetCode',   link: 'https://leetcode.com/problems/reverse-linked-list/',                  description: 'Reverse a singly linked list.' },
    { id: 'lc-217', title: 'Contains Duplicate',             difficulty: 'easy', platform: 'LeetCode',   link: 'https://leetcode.com/problems/contains-duplicate/',                   description: 'Return true if any value appears at least twice in the array.' },
    { id: 'lc-704', title: 'Binary Search',                  difficulty: 'easy', platform: 'LeetCode',   link: 'https://leetcode.com/problems/binary-search/',                        description: 'Given a sorted array and target, return the index using binary search.' },
    { id: 'hr-1',   title: 'Sales by Match',                 difficulty: 'easy', platform: 'HackerRank', link: 'https://www.hackerrank.com/challenges/sock-merchant/problem',          description: 'Count matching pairs of socks from a pile.' },
  ],
  medium: [
    { id: 'lc-3',   title: 'Longest Substring Without Repeating Characters', difficulty: 'medium', platform: 'LeetCode',   link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', description: 'Find the length of the longest substring without repeating characters.' },
    { id: 'lc-56',  title: 'Merge Intervals',                difficulty: 'medium', platform: 'LeetCode',   link: 'https://leetcode.com/problems/merge-intervals/',                    description: 'Merge all overlapping intervals and return non-overlapping intervals.' },
    { id: 'lc-146', title: 'LRU Cache',                      difficulty: 'medium', platform: 'LeetCode',   link: 'https://leetcode.com/problems/lru-cache/',                          description: 'Design a data structure that follows Least Recently Used cache constraints.' },
    { id: 'lc-200', title: 'Number of Islands',              difficulty: 'medium', platform: 'LeetCode',   link: 'https://leetcode.com/problems/number-of-islands/',                  description: 'Count islands in a 2D grid of land and water.' },
    { id: 'lc-238', title: 'Product of Array Except Self',   difficulty: 'medium', platform: 'LeetCode',   link: 'https://leetcode.com/problems/product-of-array-except-self/',       description: 'Return array where each element is product of all others (no division).' },
    { id: 'lc-322', title: 'Coin Change',                    difficulty: 'medium', platform: 'LeetCode',   link: 'https://leetcode.com/problems/coin-change/',                        description: 'Find fewest coins needed to make up the given amount.' },
    { id: 'lc-347', title: 'Top K Frequent Elements',        difficulty: 'medium', platform: 'LeetCode',   link: 'https://leetcode.com/problems/top-k-frequent-elements/',            description: 'Return the k most frequent elements in the array.' },
    { id: 'hr-2',   title: 'Balanced Brackets',              difficulty: 'medium', platform: 'HackerRank', link: 'https://www.hackerrank.com/challenges/balanced-brackets/problem',    description: 'Determine if brackets in a string are balanced.' },
  ],
  hard: [
    { id: 'lc-4',   title: 'Median of Two Sorted Arrays',    difficulty: 'hard', platform: 'LeetCode',   link: 'https://leetcode.com/problems/median-of-two-sorted-arrays/',         description: 'Find the median of two sorted arrays in O(log(m+n)) time.' },
    { id: 'lc-23',  title: 'Merge k Sorted Lists',           difficulty: 'hard', platform: 'LeetCode',   link: 'https://leetcode.com/problems/merge-k-sorted-lists/',                description: 'Merge k sorted linked lists into one sorted list.' },
    { id: 'lc-42',  title: 'Trapping Rain Water',            difficulty: 'hard', platform: 'LeetCode',   link: 'https://leetcode.com/problems/trapping-rain-water/',                 description: 'Compute how much water can be trapped between elevation bars.' },
    { id: 'lc-51',  title: 'N-Queens',                       difficulty: 'hard', platform: 'LeetCode',   link: 'https://leetcode.com/problems/n-queens/',                            description: 'Place N queens on an NxN board so no two queens attack each other.' },
    { id: 'lc-10',  title: 'Regular Expression Matching',    difficulty: 'hard', platform: 'LeetCode',   link: 'https://leetcode.com/problems/regular-expression-matching/',         description: 'Implement regex matching with support for . and *.' },
    { id: 'lc-127', title: 'Word Ladder',                    difficulty: 'hard', platform: 'LeetCode',   link: 'https://leetcode.com/problems/word-ladder/',                         description: 'Find shortest transformation sequence from beginWord to endWord.' },
  ],
};

export function getQuestionForPosition(position: number): Question {
  const r = Math.random();
  let difficulty: Difficulty;
  if (position <= 50) {
    difficulty = r < 0.5 ? 'easy' : r < 0.8 ? 'medium' : 'hard';
  } else if (position <= 80) {
    difficulty = r < 0.3 ? 'easy' : r < 0.8 ? 'medium' : 'hard';
  } else {
    difficulty = r < 0.2 ? 'easy' : r < 0.6 ? 'medium' : 'hard';
  }
  const pool = QUESTIONS[difficulty];
  return pool[Math.floor(Math.random() * pool.length)];
}
