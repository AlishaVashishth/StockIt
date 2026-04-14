export const courseData = [
  {
    id: "module-1",
    title: "Module 1: What is a Stock?",
    lessons: [
      {
        id: "module-1-lesson-1",
        title: "Why Stocks Exist",
        type: "lesson",
        content:
          "Stocks represent ownership in a company. Companies sell shares to raise money for growth.",
      },
      {
        id: "module-1-quiz-1",
        title: "Why Stocks Exist Quiz",
        type: "quiz",
        questions: [
          {
            question: "Buying a stock means you own:",
            options: ["Debt only", "A small part of the company", "Only voting rights", "Nothing legal"],
            correctAnswer: "A small part of the company",
          },
        ],
      },
      {
        id: "module-1-lesson-2",
        title: "Primary vs Secondary Market",
        type: "lesson",
        content:
          "IPO is the primary market where company raises funds. Stock exchanges are secondary markets where investors trade among themselves.",
      },
      {
        id: "module-1-quiz-2",
        title: "Primary vs Secondary Quiz",
        type: "quiz",
        questions: [
          {
            question: "Where does a company raise fresh capital?",
            options: ["Secondary market", "IPO/primary market", "Only mutual funds", "Derivatives market"],
            correctAnswer: "IPO/primary market",
          },
        ],
      },
    ],
  },
  {
    id: "module-2",
    title: "Module 2: How to Read Charts",
    lessons: [
      {
        id: "module-2-lesson-1",
        title: "The Anatomy of a Candlestick",
        type: "lesson",
        content:
          "A candlestick shows the Open, High, Low, and Close (OHLC) for a timeframe. It gives quick visual price action context.",
      },
      {
        id: "module-2-quiz-1",
        title: "Candlestick Quiz",
        type: "quiz",
        questions: [
          {
            question: "What does a green candlestick mean?",
            options: [
              "Price closed lower than it opened",
              "Price closed higher than it opened",
              "Nobody traded",
              "The app crashed",
            ],
            correctAnswer: "Price closed higher than it opened",
          },
        ],
      },
      {
        id: "module-2-lesson-2",
        title: "Support and Resistance",
        type: "lesson",
        content:
          "Support is where the price tends to stop falling. Resistance is where it tends to stop rising.",
      },
      {
        id: "module-2-quiz-2",
        title: "Support and Resistance Quiz",
        type: "quiz",
        questions: [
          {
            question: "If a stock continuously bounces up from ₹100, what is ₹100?",
            options: ["Resistance", "A breakout", "Support", "A dividend"],
            correctAnswer: "Support",
          },
        ],
      },
      {
        id: "module-2-lesson-3",
        title: "Reading Volume",
        type: "lesson",
        content:
          "Volume confirms conviction. A breakout with high volume is generally stronger than one with low volume.",
      },
      {
        id: "module-2-quiz-3",
        title: "Volume Quiz",
        type: "quiz",
        questions: [
          {
            question: "What is the safest breakout pattern?",
            options: [
              "Breakout with very low volume",
              "Breakout with zero volume",
              "Breakout with high volume",
              "Volume does not matter",
            ],
            correctAnswer: "Breakout with high volume",
          },
        ],
      },
    ],
  },
  {
    id: "module-3",
    title: "Module 3: Understanding Risk",
    lessons: [
      {
        id: "module-3-lesson-1",
        title: "Types of Risk",
        type: "lesson",
        content:
          "Market risk affects all stocks. Company risk is business-specific. Liquidity risk appears when buying/selling is difficult.",
      },
      {
        id: "module-3-quiz-1",
        title: "Risk Types Quiz",
        type: "quiz",
        questions: [
          {
            question: "A sector-wide crash is mostly:",
            options: ["Company risk", "Market risk", "Liquidity risk", "Broker risk"],
            correctAnswer: "Market risk",
          },
        ],
      },
      {
        id: "module-3-lesson-2",
        title: "Position Sizing Basics",
        type: "lesson",
        content:
          "Do not allocate too much to one stock. Position sizing and diversification protect capital.",
      },
      {
        id: "module-3-quiz-2",
        title: "Position Sizing Quiz",
        type: "quiz",
        questions: [
          {
            question: "Good risk practice is to:",
            options: ["All-in one stock", "Diversify and size positions", "Ignore downside", "Average down always"],
            correctAnswer: "Diversify and size positions",
          },
        ],
      },
    ],
  },
  {
    id: "module-4",
    title: "Module 4: Diversification & Portfolio Building",
    lessons: [
      {
        id: "module-4-lesson-1",
        title: "What Diversification Really Means",
        type: "lesson",
        content:
          "Real diversification is across sectors and business models, not just many names in one sector.",
      },
      {
        id: "module-4-quiz-1",
        title: "Diversification Quiz",
        type: "quiz",
        questions: [
          {
            question: "Owning 5 IT stocks is:",
            options: ["Highly diversified", "Partially diversified", "Not sector-diversified", "Risk-free"],
            correctAnswer: "Not sector-diversified",
          },
        ],
      },
      {
        id: "module-4-lesson-2",
        title: "Building Core-Satellite Portfolios",
        type: "lesson",
        content:
          "Core holdings provide stability. Satellite positions are tactical, smaller bets for growth.",
      },
      {
        id: "module-4-quiz-2",
        title: "Core-Satellite Quiz",
        type: "quiz",
        questions: [
          {
            question: "Core portfolio should usually be:",
            options: ["Most volatile stocks", "Stable long-term businesses", "Only penny stocks", "Daily momentum picks"],
            correctAnswer: "Stable long-term businesses",
          },
        ],
      },
    ],
  },
  {
    id: "module-5",
    title: "Module 5: Advanced Orders & F&O Basics",
    lessons: [
      {
        id: "module-5-lesson-1",
        title: "Limit vs Market Orders",
        type: "lesson",
        content:
          "Market order executes immediately; limit order executes at your selected price or better.",
      },
      {
        id: "module-5-quiz-1",
        title: "Orders Quiz",
        type: "quiz",
        questions: [
          {
            question: "If price control is priority, use:",
            options: ["Market order", "Limit order", "Random order", "No order type"],
            correctAnswer: "Limit order",
          },
        ],
      },
      {
        id: "module-5-lesson-2",
        title: "Futures Basics",
        type: "lesson",
        content:
          "Futures are leveraged contracts. Small moves can produce larger gains or losses.",
      },
      {
        id: "module-5-quiz-2",
        title: "Futures Quiz",
        type: "quiz",
        questions: [
          {
            question: "Futures trading usually has:",
            options: ["No leverage", "Leverage and higher risk", "Guaranteed returns", "No margin"],
            correctAnswer: "Leverage and higher risk",
          },
        ],
      },
    ],
  },
  {
    id: "module-6",
    title: "Module 6: Behavioral Finance & Trading Psychology",
    lessons: [
      {
        id: "module-6-lesson-1",
        title: "Avoiding FOMO",
        type: "lesson",
        content:
          "FOMO leads to impulsive entries. Define your setup and risk before entering any momentum trade.",
      },
      {
        id: "module-6-quiz-1",
        title: "FOMO Quiz",
        type: "quiz",
        questions: [
          {
            question: "FOMO usually leads to:",
            options: ["Disciplined entries", "Impulsive trades", "Lower risk", "Better journaling"],
            correctAnswer: "Impulsive trades",
          },
        ],
      },
      {
        id: "module-6-lesson-2",
        title: "Trading Journal Habit",
        type: "lesson",
        content:
          "A trading journal helps you review execution, emotions, and mistakes to improve consistency.",
      },
      {
        id: "module-6-quiz-2",
        title: "Journaling Quiz",
        type: "quiz",
        questions: [
          {
            question: "A trading journal helps you:",
            options: ["Hide mistakes", "Track patterns and improve", "Predict market exactly", "Avoid all losses"],
            correctAnswer: "Track patterns and improve",
          },
        ],
      },
    ],
  },
];
