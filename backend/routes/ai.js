//this is the API for the AI, think of routes as the menu items in a restaurant, routes are needed for communication between frontend and backend, also think of frontend creating a route for a request and this file carrying out the request

//importing express to create a router
const express = require('express');
//creating a router
const router = express.Router();
//importing the openai api
const OpenAI = require('openai');
//importing the authentication middleware
const authMiddleware = require('../middleware/auth');

// Apply authentication middleware to all AI routes
router.use(authMiddleware);

//load API key from environment, stored in env file
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

//post request to suggest route
router.post('/suggest', async (req, res) => {
  //destructure the request body
  const { code, prompt } = req.body;

  //if no code or prompt, return an error
  if (!code || !prompt) {
    return res.status(400).json({ error: 'Code and prompt are required.' });
  }

  try {
    //compose the message for the AI
    const userMessage = `Here is some code:\n\n${code}\n\n${prompt}`;

    //create a new chat completion
    const completion = await openai.chat.completions.create({
      //model selection
      model: 'gpt-3.5-turbo',
      //gives the system a role and the user message
      messages: [
        { role: 'system', content: 'You are a helpful AI code assistant.' },
        { role: 'user', content: userMessage },
      ],
      //max tokens is the maximum number of tokens the AI can use, to prevent overuse
      max_tokens: 512,
      //temperature is the randomness of the AI's response
      temperature: 0.2,
    });

    //get the AI's response
    const suggestion = completion.choices[0].message.content;
    //send the AI's response to the frontend usign res, remeber res is for sending data to the frontend and req is for getting data from the frontend
    res.json({ suggestion });
  } catch (error) {
    //if error, log the error
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to get AI suggestion.' });
  }
});

module.exports = router; 