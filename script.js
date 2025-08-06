import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// App state
let currentPost = null;
let comments = [];

// DOM elements
const elements = {
    loading: document.getElementById('loading'),
    mainContent: document.getElementById('mainContent'),
    errorState: document.getElementById('errorState'),
    refreshBtn: document.getElementById('refreshBtn'),
    postDate: document.getElementById('postDate'),
    postCategory: document.getElementById('postCategory'),
    postTitle: document.getElementById('postTitle'),
    postImage: document.getElementById('postImage'),
    postContent: document.getElementById('postContent'),
    postSource: document.getElementById('postSource'),
    postTime: document.getElementById('postTime'),
    commentForm: document.getElementById('commentForm'),
    commenterName: document.getElementById('commenterName'),
    commentText: document.getElementById('commentText'),
    commentsList: document.getElementById('commentsList'),
    commentCount: document.getElementById('commentCount'),
    newsGrid: document.getElementById('newsGrid'),
    toast: document.getElementById('toast')
};

// Mock news data (in a real app, this would come from a news API)
const mockNewsData = {
    featured: {
        id: 'news-1',
        title: 'Major Technology Breakthrough Announced by Leading Research Institute',
        content: `Scientists at the Global Technology Research Institute have announced a groundbreaking discovery that could revolutionize renewable energy storage. The new battery technology promises to store 10 times more energy than current lithium-ion batteries while charging in under 5 minutes.

        Dr. Sarah Chen, lead researcher on the project, explained that the breakthrough came from combining advanced nanomaterials with a novel electrolyte solution. "This technology could make electric vehicles truly competitive with gasoline cars in terms of convenience," she stated during today's press conference.

        The research team has been working on this project for over three years, with funding from both government grants and private investors. Initial testing shows the batteries maintain 95% capacity after 10,000 charge cycles, far exceeding current battery technology.

        Major automotive manufacturers have already expressed interest in licensing the technology, with some planning to integrate it into their electric vehicle lines as early as 2026. The announcement has caused significant movement in clean energy stocks, with several companies seeing double-digit gains.

        Environmental groups have praised the development, noting that improved battery technology is crucial for widespread adoption of renewable energy sources. The technology could also have applications in grid-scale energy storage, helping to stabilize power grids that rely heavily on solar and wind energy.`,
        category: 'Technology',
        source: 'Tech News Daily',
        publishedAt: new Date().toISOString(),
        imageUrl: 'https://images.pexels.com/photos/159201/science-chemistry-lab-laboratory-159201.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    other: [
        {
            id: 'news-2',
            title: 'Global Climate Summit Reaches Historic Agreement',
            summary: 'World leaders agree on ambitious new targets for carbon reduction and renewable energy adoption.',
            source: 'Environmental Times',
            publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'news-3',
            title: 'Space Mission Successfully Lands on Mars',
            summary: 'International space agency confirms successful landing of robotic explorer on the Red Planet.',
            source: 'Space Explorer',
            publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'news-4',
            title: 'New Medical Treatment Shows Promise in Clinical Trials',
            summary: 'Breakthrough therapy demonstrates significant improvement in treating rare genetic disorders.',
            source: 'Medical Journal',
            publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
    ]
};

// AI response templates for generating polite and useful responses
const aiResponseTemplates = [
    {
        keywords: ['agree', 'great', 'amazing', 'awesome', 'love'],
        responses: [
            "Thank you for sharing your positive perspective! It's wonderful to see such enthusiasm about this topic.",
            "I appreciate your supportive comment. Your optimism about this development is truly encouraging.",
            "It's great to hear from someone who shares excitement about these advancements. Thank you for your input!"
        ]
    },
    {
        keywords: ['disagree', 'wrong', 'bad', 'terrible', 'hate'],
        responses: [
            "I understand you have concerns about this topic. Different perspectives help us have more balanced discussions.",
            "Thank you for sharing your viewpoint. It's important to consider various angles on complex issues like this.",
            "I appreciate you taking the time to share your thoughts, even if they differ from others. Diverse opinions enrich our understanding."
        ]
    },
    {
        keywords: ['question', 'how', 'why', 'what', 'when', '?'],
        responses: [
            "That's an excellent question! While I don't have all the details, I'd encourage looking into the original research for more comprehensive information.",
            "Great question! This topic certainly raises many interesting points worth exploring further.",
            "You've raised an important question that many others are probably wondering about too. Thank you for bringing it up!"
        ]
    },
    {
        keywords: ['concern', 'worried', 'problem', 'issue', 'risk'],
        responses: [
            "Your concerns are valid and worth discussing. It's important to consider both the benefits and potential challenges of any new development.",
            "Thank you for raising these important concerns. Thoughtful consideration of potential issues is crucial for responsible progress.",
            "I appreciate you highlighting these concerns. It's through careful examination of potential risks that we can work toward better solutions."
        ]
    }
];

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
        return 'Just now';
    } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
}

function showToast(message, type = 'success') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

function generateAIResponse(commentText) {
    const lowerComment = commentText.toLowerCase();
    
    // Find matching template based on keywords
    for (const template of aiResponseTemplates) {
        if (template.keywords.some(keyword => lowerComment.includes(keyword))) {
            const randomIndex = Math.floor(Math.random() * template.responses.length);
            return template.responses[randomIndex];
        }
    }
    
    // Default response if no keywords match
    const defaultResponses = [
        "Thank you for sharing your thoughts on this topic. Your perspective adds valuable insight to the discussion.",
        "I appreciate you taking the time to comment. It's always interesting to hear different viewpoints on current events.",
        "Thanks for engaging with this story. Community discussions like this help us all stay informed and think critically."
    ];
    
    const randomIndex = Math.floor(Math.random() * defaultResponses.length);
    return defaultResponses[randomIndex];
}

// Database functions
async function saveComment(comment) {
    if (!supabase) {
        // Store in localStorage if Supabase is not available
        const savedComments = JSON.parse(localStorage.getItem('comments') || '[]');
        savedComments.push(comment);
        localStorage.setItem('comments', JSON.stringify(savedComments));
        return comment;
    }
    
    try {
        const { data, error } = await supabase
            .from('comments')
            .insert([comment])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving comment:', error);
        throw error;
    }
}

async function loadComments(postId) {
    if (!supabase) {
        // Load from localStorage if Supabase is not available
        const savedComments = JSON.parse(localStorage.getItem('comments') || '[]');
        return savedComments.filter(comment => comment.post_id === postId);
    }
    
    try {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error loading comments:', error);
        return [];
    }
}

// UI functions
function displayFeaturedPost(post) {
    currentPost = post;
    
    elements.postDate.textContent = formatDate(post.publishedAt);
    elements.postCategory.textContent = post.category;
    elements.postTitle.textContent = post.title;
    elements.postContent.textContent = post.content;
    elements.postSource.textContent = `Source: ${post.source}`;
    elements.postTime.textContent = formatTime(post.publishedAt);
    
    // Display image or placeholder
    if (post.imageUrl) {
        elements.postImage.innerHTML = `<img src="${post.imageUrl}" alt="${post.title}" loading="lazy">`;
    } else {
        elements.postImage.innerHTML = '📰';
    }
}

function displayOtherNews(newsItems) {
    elements.newsGrid.innerHTML = newsItems.map(item => `
        <article class="news-item" onclick="showToast('Full article would open here', 'success')">
            <h4 class="news-item-title">${item.title}</h4>
            <p class="news-item-summary">${item.summary}</p>
            <div class="news-item-meta">
                ${item.source} • ${formatTime(item.publishedAt)}
            </div>
        </article>
    `).join('');
}

function displayComments(commentsList) {
    comments = commentsList;
    elements.commentCount.textContent = comments.length;
    
    if (comments.length === 0) {
        elements.commentsList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
        `;
        return;
    }
    
    elements.commentsList.innerHTML = comments.map(comment => `
        <article class="comment">
            <div class="comment-header">
                <span class="comment-author">${comment.author_name}</span>
                <span class="comment-time">${formatTime(comment.created_at)}</span>
            </div>
            <p class="comment-text">${comment.content}</p>
            ${comment.ai_response ? `
                <div class="ai-response">
                    <p class="ai-response-text">${comment.ai_response}</p>
                </div>
            ` : ''}
        </article>
    `).join('');
}

// Event handlers
async function handleCommentSubmit(event) {
    event.preventDefault();
    
    const name = elements.commenterName.value.trim();
    const text = elements.commentText.value.trim();
    
    if (!name || !text) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (!currentPost) {
        showToast('No post selected', 'error');
        return;
    }
    
    try {
        // Create comment object
        const comment = {
            id: uuidv4(),
            post_id: currentPost.id,
            author_name: name,
            content: text,
            created_at: new Date().toISOString(),
            ai_response: generateAIResponse(text)
        };
        
        // Save comment
        await saveComment(comment);
        
        // Add to local comments array and refresh display
        comments.push(comment);
        displayComments(comments);
        
        // Clear form
        elements.commentForm.reset();
        
        showToast('Comment posted successfully!', 'success');
        
        // Simulate AI response delay
        setTimeout(() => {
            showToast('AI response generated!', 'success');
        }, 2000);
        
    } catch (error) {
        console.error('Error posting comment:', error);
        showToast('Failed to post comment. Please try again.', 'error');
    }
}

async function loadNews() {
    try {
        elements.loading.style.display = 'flex';
        elements.mainContent.style.display = 'none';
        elements.errorState.style.display = 'none';
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real app, you would fetch from a news API here
        const newsData = mockNewsData;
        
        // Display featured post
        displayFeaturedPost(newsData.featured);
        
        // Display other news
        displayOtherNews(newsData.other);
        
        // Load comments for the featured post
        const postComments = await loadComments(newsData.featured.id);
        displayComments(postComments);
        
        // Show main content
        elements.loading.style.display = 'none';
        elements.mainContent.style.display = 'block';
        
        showToast('News loaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error loading news:', error);
        elements.loading.style.display = 'none';
        elements.errorState.style.display = 'flex';
        showToast('Failed to load news', 'error');
    }
}

// Initialize app
async function initApp() {
    console.log('🚀 Daily News Blog App Starting...');
    
    // Set up event listeners
    elements.commentForm.addEventListener('submit', handleCommentSubmit);
    elements.refreshBtn.addEventListener('click', loadNews);
    
    // Load initial news
    await loadNews();
    
    console.log('✅ App initialized successfully');
}

// Start the app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
