export interface Retreat {
  id: number;
  image: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  title: string;
  instructor: {
    name: string;
    avatar: string;
    bio: string;
  };
  location: string;
  date: string;
  duration: string;
  spotsAvailable: number;
  totalSpots: number;
  price: number;
  description: string;
  includes: string[];
  schedule: {
    day: string;
    activities: string;
  }[];
}

export const retreats: Retreat[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1706614452468-d9d7c5b967b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxxdWlsdGluZyUyMGZhYnJpYyUyMGNvbG9yZnVsfGVufDF8fHx8MTc2MDM4NTc4NXww&ixlib=rb-4.1.0&q=80&w=1080",
    level: "Intermediate",
    title: "Modern Quilting Techniques",
    instructor: {
      name: "Emma Thompson",
      avatar: "https://images.unsplash.com/photo-1543430720-fa600c67e423?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100&h=100",
      bio: "Emma has been teaching quilting for over 15 years and specializes in modern techniques. She's passionate about helping students discover their unique quilting style."
    },
    location: "Burlington, Vermont",
    date: "Nov 5-8, 2025",
    duration: "4 days",
    spotsAvailable: 3,
    totalSpots: 12,
    price: 850,
    description: "Join us for an immersive 4-day retreat focused on modern quilting techniques. You'll learn innovative piecing methods, explore contemporary color theory, and create stunning modern quilt designs.",
    includes: [
      "All materials and fabric",
      "Daily breakfast and lunch",
      "Accommodation at the retreat center",
      "Access to professional sewing equipment",
      "Take-home project kit"
    ],
    schedule: [
      { day: "Day 1", activities: "Introduction, Color Theory, and Design Basics" },
      { day: "Day 2", activities: "Modern Piecing Techniques and Pattern Work" },
      { day: "Day 3", activities: "Advanced Methods and Personal Project" },
      { day: "Day 4", activities: "Finishing Touches and Showcase" }
    ]
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1723074832961-397744da2380?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    level: "Advanced",
    title: "Art Quilt Masterclass",
    instructor: {
      name: "Maria Santos",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100&h=100",
      bio: "Maria is an award-winning fiber artist with 20 years of experience in contemporary quilt design. She has exhibited globally and teaches advanced artistic techniques."
    },
    location: "Portland, Oregon",
    date: "Dec 12-15, 2025",
    duration: "4 days",
    spotsAvailable: 5,
    totalSpots: 10,
    price: 950,
    description: "An intensive masterclass for experienced quilters looking to elevate their art. Explore advanced artistic concepts, mixed media techniques, and develop your signature quilting style.",
    includes: [
      "Premium materials and specialty fabrics",
      "Meals at gourmet farm-to-table restaurants",
      "Private studio accommodation",
      "Access to gallery and exhibition spaces",
      "Mentorship sessions with instructor",
      "Art exhibition opportunity"
    ],
    schedule: [
      { day: "Day 1", activities: "Artistic Vision and Conceptualization" },
      { day: "Day 2", activities: "Advanced Textile Techniques" },
      { day: "Day 3", activities: "Mixed Media Integration and Experimentation" },
      { day: "Day 4", activities: "Portfolio Development and Critique" }
    ]
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    level: "Beginner",
    title: "Beginner's Quilting Journey",
    instructor: {
      name: "Sarah Johnson",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100&h=100",
      bio: "Sarah is a patient and enthusiastic quilting instructor who loves welcoming beginners into the craft. She breaks down complex techniques into easy-to-follow steps."
    },
    location: "Austin, Texas",
    date: "Jan 15-18, 2026",
    duration: "4 days",
    spotsAvailable: 8,
    totalSpots: 15,
    price: 750,
    description: "Perfect for beginners! Learn the fundamentals of quilting in a supportive, welcoming environment. No experience necessary—just bring your creativity and enthusiasm.",
    includes: [
      "Complete beginner's fabric kit",
      "All tools and needles provided",
      "Meals and snacks included",
      "Cozy accommodation",
      "Sewing machine provided",
      "Take-home project and supplies"
    ],
    schedule: [
      { day: "Day 1", activities: "Introduction to Quilting Basics and Safety" },
      { day: "Day 2", activities: "Cutting, Piecing, and Simple Patterns" },
      { day: "Day 3", activities: "Assembling Your First Quilt Top" },
      { day: "Day 4", activities: "Finishing, Binding, and Care Tips" }
    ]
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1706614452468-d9d7c5b967b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxxdWlsdGluZyUyMGZhYnJpYyUyMGNvbG9yZnVsfGVufDF8fHx8MTc2MDM4NTc4NXww&ixlib=rb-4.1.0&q=80&w=1080",
    level: "Intermediate",
    title: "Coastal Quilting Escape",
    instructor: {
      name: "James Mitchell",
      avatar: "https://images.unsplash.com/photo-1543430720-fa600c67e423?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100&h=100",
      bio: "James combines traditional quilting with coastal inspiration. His relaxed teaching style and beautiful designs make learning enjoyable and memorable."
    },
    location: "Mendocino, California",
    date: "Feb 14-17, 2026",
    duration: "4 days",
    spotsAvailable: 4,
    totalSpots: 10,
    price: 900,
    description: "Escape to the coast and immerse yourself in quilting! Combine ocean views, fresh air, and creative learning with beach-inspired quilting projects.",
    includes: [
      "Coastal-themed fabric collection",
      "Beach-view accommodation",
      "Daily farm-fresh meals",
      "Guided beach walks",
      "Sunset quilting sessions",
      "Finished project to take home"
    ],
    schedule: [
      { day: "Day 1", activities: "Coastal Color Inspiration and Design" },
      { day: "Day 2", activities: "Ocean-Inspired Patterns and Piecing" },
      { day: "Day 3", activities: "Beach Walk and Creative Refresh" },
      { day: "Day 4", activities: "Final Touches and Sunset Celebration" }
    ]
  }
];

export const getRetreatById = (id: number): Retreat | undefined => {
  return retreats.find(retreat => retreat.id === id);
};
