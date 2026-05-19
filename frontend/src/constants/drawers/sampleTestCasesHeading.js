/**
 * @module sampleTestCasesHeading
 * @description Content for the sample test cases heading drawer.
 * Explains what test cases are, their benefits, and how to use them.
 */

/**
 * Sample test cases heading content object.
 * @type {Object}
 */
export const SAMPLE_TEST_CASES_HEADING_CONTENT = {
  heading: 'Sample Test Cases',
  description:
    'Test Cases are pre-filled form submissions representing real circular economy business models. They help you:',
  benefits: [
    'Understand what makes a strong submission',
    'See how different business models are structured',
    'Learn the level of detail expected',
    'Get inspiration for your own circular economy solution',
  ],
  sections: {
    howTheyWork: {
      title: 'How to Use Test Cases',
      steps: [
        {
          num: 1,
          title: 'Click "Load Test Case"',
          desc: 'Click "Load Test Case" to populate the form with a complete example.',
        },
        {
          num: 2,
          title: 'Review and Understand',
          desc: 'See how different business models are structured and what makes a good submission.',
        },
        {
          num: 3,
          title: 'Modify or Create Your Own',
          desc: 'You can modify the example or use it as a reference for your own submission.',
        },
      ],
    },
    tip: 'Study how successful circular economy businesses structure their problems, solutions, and evaluation parameters. Notice the use of specific numbers and measurable outcomes.',
  },
};
