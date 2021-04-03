
import Wizard from 'wizard';

const questions = {
    question: 'My question',
    id: 'my-question',
    type: 'list',
    options: [
      { name: 'Answer 1', value: 'answer-1', then: 'question2' },
      { name: 'Answer 2', value: 'answer-2', then: 'question3' },
    ],
    then: {
      question2: {
        question: 'Question 2',
        id: 'question-2',
        type: 'list',
        options: [
          { name: 'Answer 1', value: 'answer-1' },
          { name: 'Answer 2', value: 'answer-2' },
        ]
      },
      question3: {
        question: 'Question 3',
        id: 'question-3',
        type: 'list',
        options: [
          { name: 'Answer 1', value: 'answer-1' },
          { name: 'Answer 2', value: 'answer-2' },
          { name: 'Answer 3', value: 'answer-3' },
          { name: 'Answer 4', value: 'answer-4' },
        ]
      }
    }
  }
 

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
   
  readline.question('Who are you?', name => {
    console.log(`Hey there ${name}!`);
    const wizard2 = new Wizard(questions);
        wizard2.init().then(selections => {
        console.log(selections);
        process.exit();
        });

    readline.close();
  });