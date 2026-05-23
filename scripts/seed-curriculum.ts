import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { realtime: { transport: ws as any } },
);

const curriculum = [
  {
    id: "p1",
    order_index: 1,
    title: "Foundations",
    icon: "Sparkles",
    color: "cyan",
    description: "Math, Python, and the toolkit every data scientist needs",
    topics: [
      {
        id: "t1-1",
        title: "Python Essentials",
        subtopics: [
          {
            id: "s1-1-1",
            title: "Variables & Data Types",
            difficulty: "beginner",
          },
          {
            id: "s1-1-2",
            title: "Control Flow & Loops",
            difficulty: "beginner",
          },
          {
            id: "s1-1-3",
            title: "Functions & Lambdas",
            difficulty: "beginner",
          },
          {
            id: "s1-1-4",
            title: "Lists, Dicts, Sets, Tuples",
            difficulty: "beginner",
          },
          {
            id: "s1-1-5",
            title: "List Comprehensions",
            difficulty: "beginner",
          },
          {
            id: "s1-1-6",
            title: "Object-Oriented Python",
            difficulty: "intermediate",
          },
        ],
      },
      {
        id: "t1-2",
        title: "Statistics for DS",
        subtopics: [
          {
            id: "s1-2-1",
            title: "Descriptive Statistics",
            difficulty: "beginner",
          },
          { id: "s1-2-2", title: "Probability Basics", difficulty: "beginner" },
          {
            id: "s1-2-3",
            title: "Distributions (Normal, Binomial, Poisson)",
            difficulty: "intermediate",
          },
          {
            id: "s1-2-4",
            title: "Central Limit Theorem",
            difficulty: "intermediate",
          },
          {
            id: "s1-2-5",
            title: "Hypothesis Testing",
            difficulty: "intermediate",
          },
          {
            id: "s1-2-6",
            title: "p-values & Confidence Intervals",
            difficulty: "intermediate",
          },
        ],
      },
      {
        id: "t1-3",
        title: "Linear Algebra",
        subtopics: [
          {
            id: "s1-3-1",
            title: "Vectors & Operations",
            difficulty: "beginner",
          },
          {
            id: "s1-3-2",
            title: "Matrices & Matrix Multiplication",
            difficulty: "intermediate",
          },
          {
            id: "s1-3-3",
            title: "Eigenvalues & Eigenvectors",
            difficulty: "advanced",
          },
          {
            id: "s1-3-4",
            title: "Dot Product & Cosine Similarity",
            difficulty: "intermediate",
          },
        ],
      },
      {
        id: "t1-4",
        title: "Calculus & Optimization",
        subtopics: [
          {
            id: "s1-4-1",
            title: "Derivatives (Intuition)",
            difficulty: "beginner",
          },
          {
            id: "s1-4-2",
            title: "Gradients & Partial Derivatives",
            difficulty: "intermediate",
          },
          {
            id: "s1-4-3",
            title: "Chain Rule (for Backprop)",
            difficulty: "intermediate",
          },
          {
            id: "s1-4-4",
            title: "Convex Optimization Basics",
            difficulty: "advanced",
          },
        ],
      },
    ],
  },
  {
    id: "p2",
    order_index: 2,
    title: "Data Handling",
    icon: "Database",
    color: "violet",
    description: "NumPy, Pandas, SQL — turn messy data into clean insights",
    topics: [
      {
        id: "t2-1",
        title: "NumPy",
        subtopics: [
          { id: "s2-1-1", title: "Arrays & ndarray", difficulty: "beginner" },
          { id: "s2-1-2", title: "Indexing & Slicing", difficulty: "beginner" },
          { id: "s2-1-3", title: "Broadcasting", difficulty: "intermediate" },
          {
            id: "s2-1-4",
            title: "Vectorized Operations",
            difficulty: "intermediate",
          },
        ],
      },
      {
        id: "t2-2",
        title: "Pandas",
        subtopics: [
          { id: "s2-2-1", title: "Series & DataFrame", difficulty: "beginner" },
          {
            id: "s2-2-2",
            title: "Reading CSV, JSON, Excel",
            difficulty: "beginner",
          },
          {
            id: "s2-2-3",
            title: "Filtering & Selecting",
            difficulty: "beginner",
          },
          {
            id: "s2-2-4",
            title: "GroupBy & Aggregation",
            difficulty: "intermediate",
          },
          {
            id: "s2-2-5",
            title: "Merge, Join, Concat",
            difficulty: "intermediate",
          },
          { id: "s2-2-6", title: "Pivot Tables", difficulty: "intermediate" },
          {
            id: "s2-2-7",
            title: "Time Series Basics",
            difficulty: "intermediate",
          },
        ],
      },
      {
        id: "t2-3",
        title: "Data Cleaning",
        subtopics: [
          {
            id: "s2-3-1",
            title: "Handling Missing Data",
            difficulty: "beginner",
          },
          {
            id: "s2-3-2",
            title: "Outlier Detection",
            difficulty: "intermediate",
          },
          {
            id: "s2-3-3",
            title: "Data Type Conversion",
            difficulty: "beginner",
          },
          { id: "s2-3-4", title: "String Cleaning", difficulty: "beginner" },
        ],
      },
      {
        id: "t2-4",
        title: "SQL for Data Science",
        subtopics: [
          {
            id: "s2-4-1",
            title: "SELECT, WHERE, ORDER BY",
            difficulty: "beginner",
          },
          {
            id: "s2-4-2",
            title: "JOINs (Inner, Left, Right, Full)",
            difficulty: "intermediate",
          },
          {
            id: "s2-4-3",
            title: "GROUP BY & HAVING",
            difficulty: "intermediate",
          },
          { id: "s2-4-4", title: "Window Functions", difficulty: "advanced" },
          { id: "s2-4-5", title: "CTEs & Subqueries", difficulty: "advanced" },
        ],
      },
    ],
  },
  {
    id: "p3",
    order_index: 3,
    title: "EDA & Visualization",
    icon: "BarChart3",
    color: "pink",
    description: "Find the story in the data",
    topics: [
      {
        id: "t3-1",
        title: "Exploratory Data Analysis",
        subtopics: [
          {
            id: "s3-1-1",
            title: "EDA Workflow & Mindset",
            difficulty: "beginner",
          },
          {
            id: "s3-1-2",
            title: "Univariate Analysis",
            difficulty: "beginner",
          },
          {
            id: "s3-1-3",
            title: "Bivariate Analysis",
            difficulty: "intermediate",
          },
          {
            id: "s3-1-4",
            title: "Correlation Analysis",
            difficulty: "intermediate",
          },
        ],
      },
      {
        id: "t3-2",
        title: "Matplotlib & Seaborn",
        subtopics: [
          {
            id: "s3-2-1",
            title: "Basic Plots (line, bar, scatter)",
            difficulty: "beginner",
          },
          { id: "s3-2-2", title: "Histograms & KDE", difficulty: "beginner" },
          {
            id: "s3-2-3",
            title: "Heatmaps & Pairplots",
            difficulty: "intermediate",
          },
          {
            id: "s3-2-4",
            title: "Customization & Styling",
            difficulty: "intermediate",
          },
        ],
      },
      {
        id: "t3-3",
        title: "Storytelling with Data",
        subtopics: [
          {
            id: "s3-3-1",
            title: "Choosing the Right Chart",
            difficulty: "intermediate",
          },
          {
            id: "s3-3-2",
            title: "Dashboard Design Principles",
            difficulty: "intermediate",
          },
        ],
      },
    ],
  },
  {
    id: "p4",
    order_index: 4,
    title: "Machine Learning",
    icon: "Brain",
    color: "green",
    description: "The classical ML toolkit",
    topics: [
      {
        id: "t4-1",
        title: "ML Foundations",
        subtopics: [
          {
            id: "s4-1-1",
            title: "Supervised vs Unsupervised",
            difficulty: "beginner",
          },
          {
            id: "s4-1-2",
            title: "Train/Test/Validation Split",
            difficulty: "beginner",
          },
          {
            id: "s4-1-3",
            title: "Bias-Variance Tradeoff",
            difficulty: "intermediate",
          },
          {
            id: "s4-1-4",
            title: "Overfitting & Underfitting",
            difficulty: "intermediate",
          },
          {
            id: "s4-1-5",
            title: "Cross-Validation",
            difficulty: "intermediate",
          },
        ],
      },
      {
        id: "t4-2",
        title: "Regression",
        subtopics: [
          { id: "s4-2-1", title: "Linear Regression", difficulty: "beginner" },
          {
            id: "s4-2-2",
            title: "Polynomial Regression",
            difficulty: "intermediate",
          },
          {
            id: "s4-2-3",
            title: "Ridge & Lasso (Regularization)",
            difficulty: "intermediate",
          },
          {
            id: "s4-2-4",
            title: "Evaluation: MAE, MSE, RMSE, R²",
            difficulty: "intermediate",
          },
        ],
      },
      {
        id: "t4-3",
        title: "Classification",
        subtopics: [
          {
            id: "s4-3-1",
            title: "Logistic Regression",
            difficulty: "beginner",
          },
          {
            id: "s4-3-2",
            title: "k-Nearest Neighbors",
            difficulty: "beginner",
          },
          { id: "s4-3-3", title: "Decision Trees", difficulty: "intermediate" },
          { id: "s4-3-4", title: "Naive Bayes", difficulty: "intermediate" },
          {
            id: "s4-3-5",
            title: "Support Vector Machines",
            difficulty: "advanced",
          },
          {
            id: "s4-3-6",
            title: "Evaluation: Precision, Recall, F1, ROC-AUC",
            difficulty: "intermediate",
          },
          {
            id: "s4-3-7",
            title: "Confusion Matrix Deep Dive",
            difficulty: "intermediate",
          },
        ],
      },
      {
        id: "t4-4",
        title: "Unsupervised Learning",
        subtopics: [
          { id: "s4-4-1", title: "K-Means Clustering", difficulty: "beginner" },
          {
            id: "s4-4-2",
            title: "Hierarchical Clustering",
            difficulty: "intermediate",
          },
          { id: "s4-4-3", title: "DBSCAN", difficulty: "intermediate" },
          {
            id: "s4-4-4",
            title: "PCA (Dimensionality Reduction)",
            difficulty: "intermediate",
          },
          { id: "s4-4-5", title: "t-SNE & UMAP", difficulty: "advanced" },
        ],
      },
      {
        id: "t4-5",
        title: "Feature Engineering",
        subtopics: [
          {
            id: "s4-5-1",
            title: "Encoding Categorical Variables",
            difficulty: "beginner",
          },
          {
            id: "s4-5-2",
            title: "Scaling & Normalization",
            difficulty: "beginner",
          },
          {
            id: "s4-5-3",
            title: "Feature Selection Methods",
            difficulty: "intermediate",
          },
          {
            id: "s4-5-4",
            title: "Feature Importance",
            difficulty: "intermediate",
          },
        ],
      },
    ],
  },
  {
    id: "p5",
    order_index: 5,
    title: "Advanced ML",
    icon: "Zap",
    color: "yellow",
    description: "Ensembles, time series, recommendations",
    topics: [
      {
        id: "t5-1",
        title: "Ensemble Methods",
        subtopics: [
          {
            id: "s5-1-1",
            title: "Bagging & Random Forests",
            difficulty: "intermediate",
          },
          {
            id: "s5-1-2",
            title: "Boosting Concepts",
            difficulty: "intermediate",
          },
          { id: "s5-1-3", title: "XGBoost", difficulty: "advanced" },
          {
            id: "s5-1-4",
            title: "LightGBM & CatBoost",
            difficulty: "advanced",
          },
          {
            id: "s5-1-5",
            title: "Stacking & Blending",
            difficulty: "advanced",
          },
        ],
      },
      {
        id: "t5-2",
        title: "Hyperparameter Tuning",
        subtopics: [
          { id: "s5-2-1", title: "Grid Search", difficulty: "intermediate" },
          { id: "s5-2-2", title: "Random Search", difficulty: "intermediate" },
          {
            id: "s5-2-3",
            title: "Bayesian Optimization (Optuna)",
            difficulty: "advanced",
          },
        ],
      },
      {
        id: "t5-3",
        title: "Time Series",
        subtopics: [
          {
            id: "s5-3-1",
            title: "Components of Time Series",
            difficulty: "beginner",
          },
          { id: "s5-3-2", title: "ARIMA Models", difficulty: "advanced" },
          { id: "s5-3-3", title: "Prophet", difficulty: "intermediate" },
        ],
      },
      {
        id: "t5-4",
        title: "Recommendation Systems",
        subtopics: [
          {
            id: "s5-4-1",
            title: "Content-Based Filtering",
            difficulty: "intermediate",
          },
          {
            id: "s5-4-2",
            title: "Collaborative Filtering",
            difficulty: "intermediate",
          },
          {
            id: "s5-4-3",
            title: "Matrix Factorization",
            difficulty: "advanced",
          },
        ],
      },
    ],
  },
  {
    id: "p6",
    order_index: 6,
    title: "Deep Learning",
    icon: "Network",
    color: "orange",
    description: "Neural networks, CNNs, RNNs, Transformers, LLMs",
    topics: [
      {
        id: "t6-1",
        title: "Neural Network Basics",
        subtopics: [
          {
            id: "s6-1-1",
            title: "Perceptron & Activation Functions",
            difficulty: "beginner",
          },
          {
            id: "s6-1-2",
            title: "Feedforward Networks",
            difficulty: "intermediate",
          },
          { id: "s6-1-3", title: "Backpropagation", difficulty: "advanced" },
          { id: "s6-1-4", title: "Loss Functions", difficulty: "intermediate" },
          {
            id: "s6-1-5",
            title: "Optimizers (SGD, Adam)",
            difficulty: "intermediate",
          },
        ],
      },
      {
        id: "t6-2",
        title: "PyTorch / TensorFlow",
        subtopics: [
          {
            id: "s6-2-1",
            title: "Tensors & Operations",
            difficulty: "beginner",
          },
          {
            id: "s6-2-2",
            title: "Building a Model",
            difficulty: "intermediate",
          },
          { id: "s6-2-3", title: "Training Loop", difficulty: "intermediate" },
        ],
      },
      {
        id: "t6-3",
        title: "CNNs",
        subtopics: [
          {
            id: "s6-3-1",
            title: "Convolution Operation",
            difficulty: "intermediate",
          },
          {
            id: "s6-3-2",
            title: "Pooling & Architectures",
            difficulty: "intermediate",
          },
          { id: "s6-3-3", title: "Transfer Learning", difficulty: "advanced" },
        ],
      },
      {
        id: "t6-4",
        title: "RNNs & Sequences",
        subtopics: [
          { id: "s6-4-1", title: "RNN Basics", difficulty: "intermediate" },
          { id: "s6-4-2", title: "LSTM & GRU", difficulty: "advanced" },
        ],
      },
      {
        id: "t6-5",
        title: "Transformers & LLMs",
        subtopics: [
          {
            id: "s6-5-1",
            title: "Attention Mechanism",
            difficulty: "advanced",
          },
          {
            id: "s6-5-2",
            title: "Transformer Architecture",
            difficulty: "advanced",
          },
          {
            id: "s6-5-3",
            title: "BERT, GPT, LLaMA Overview",
            difficulty: "advanced",
          },
          {
            id: "s6-5-4",
            title: "Fine-tuning vs Prompt Engineering",
            difficulty: "advanced",
          },
          { id: "s6-5-5", title: "RAG Architecture", difficulty: "advanced" },
        ],
      },
    ],
  },
  {
    id: "p7",
    order_index: 7,
    title: "MLOps & Production",
    icon: "Rocket",
    color: "red",
    description: "Deploy, monitor, scale ML systems",
    topics: [
      {
        id: "t7-1",
        title: "Deployment",
        subtopics: [
          { id: "s7-1-1", title: "FastAPI for ML", difficulty: "intermediate" },
          { id: "s7-1-2", title: "Docker Basics", difficulty: "intermediate" },
          {
            id: "s7-1-3",
            title: "Cloud Deployment (AWS/GCP)",
            difficulty: "advanced",
          },
        ],
      },
      {
        id: "t7-2",
        title: "Monitoring & MLOps",
        subtopics: [
          {
            id: "s7-2-1",
            title: "Model Drift Detection",
            difficulty: "advanced",
          },
          { id: "s7-2-2", title: "A/B Testing Models", difficulty: "advanced" },
          { id: "s7-2-3", title: "CI/CD for ML", difficulty: "advanced" },
          {
            id: "s7-2-4",
            title: "Experiment Tracking (MLflow)",
            difficulty: "intermediate",
          },
        ],
      },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding curriculum...\n");

  // Clear existing (re-runnable)
  await supabase.from("subtopics").delete().neq("id", "");
  await supabase.from("topics").delete().neq("id", "");
  await supabase.from("phases").delete().neq("id", "");

  let totalSubtopics = 0;

  for (const phase of curriculum) {
    await supabase.from("phases").insert({
      id: phase.id,
      order_index: phase.order_index,
      title: phase.title,
      description: phase.description,
      icon: phase.icon,
      color: phase.color,
    });

    for (let ti = 0; ti < phase.topics.length; ti++) {
      const topic = phase.topics[ti];
      await supabase.from("topics").insert({
        id: topic.id,
        phase_id: phase.id,
        order_index: ti + 1,
        title: topic.title,
      });

      for (let si = 0; si < topic.subtopics.length; si++) {
        const sub = topic.subtopics[si];
        await supabase.from("subtopics").insert({
          id: sub.id,
          topic_id: topic.id,
          order_index: si + 1,
          title: sub.title,
          difficulty: sub.difficulty,
        });
        totalSubtopics++;
      }
    }
    console.log(`✅ ${phase.title}: ${phase.topics.length} topics`);
  }

  console.log(
    `\n🎉 Total: ${totalSubtopics} subtopics across ${curriculum.length} phases`,
  );
}

main().catch(console.error);
