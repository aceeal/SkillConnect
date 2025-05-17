// src/app/page.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  
  // Refs for animation elements
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const signUpRef = useRef(null); // Added ref for sign-up section
  const step1Ref = useRef(null);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);
  const infoSectionRef = useRef(null); // Added ref for info section
  
  // Intersection Observer setup for scroll animations
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          
          // If it's the "How It Works" section, trigger the sequential animations
          if (entry.target === howItWorksRef.current) {
            if (step1Ref.current) {
              setTimeout(() => {
                step1Ref.current.classList.add('step-animate-in');
              }, 300);
            }
            
            if (step2Ref.current) {
              setTimeout(() => {
                step2Ref.current.classList.add('step-animate-in');
              }, 800);
            }
            
            if (step3Ref.current) {
              setTimeout(() => {
                step3Ref.current.classList.add('step-animate-in');
              }, 1300);
            }
          }
          
          // If it's the info section, animate the cards
          if (entry.target === infoSectionRef.current) {
            const cards = infoSectionRef.current.querySelectorAll('.card-animate-item');
            cards.forEach((card, index) => {
              setTimeout(() => {
                card.style.animation = 'fadeInUp 0.8s ease-out forwards';
                card.style.animationDelay = `${index * 200}ms`;
              }, 300 + (index * 200));
            });
          }
          
          // If it's the Sign-Up section, add custom animations to child elements
          if (entry.target === signUpRef.current) {
            const card = signUpRef.current.querySelector('.sign-up-card');
            const content = signUpRef.current.querySelector('.sign-up-content');
            const image = signUpRef.current.querySelector('.sign-up-image');
            
            if (card) {
              card.classList.add('sign-up-animate-in');
            }
            
            if (content) {
              setTimeout(() => {
                content.classList.add('sign-up-content-animate-in');
              }, 300);
            }
            
            if (image) {
              setTimeout(() => {
                image.classList.add('sign-up-image-animate-in');
              }, 600);
            }
          }
        }
      });
    };
    
    const observer = new IntersectionObserver(observerCallback, options);
    
    // Observe elements
    if (featuresRef.current) observer.observe(featuresRef.current);
    if (howItWorksRef.current) observer.observe(howItWorksRef.current);
    if (signUpRef.current && status === 'unauthenticated') observer.observe(signUpRef.current); // Only observe if not signed in
    if (infoSectionRef.current && status === 'authenticated') observer.observe(infoSectionRef.current); // Only observe if signed in
    
    // Cleanup
    return () => {
      if (featuresRef.current) observer.unobserve(featuresRef.current);
      if (howItWorksRef.current) observer.unobserve(howItWorksRef.current);
      if (signUpRef.current) observer.unobserve(signUpRef.current);
      if (infoSectionRef.current) observer.unobserve(infoSectionRef.current);
    };
  }, [status]); // Add status as dependency
  
  return (
    <div className="min-h-screen bg-background">
      {/* Updated Skeleton Loading State */}
      {isLoading ? (
        <div className="flex flex-col min-h-screen">
          {/* Hero Section Skeleton */}
          <div className="relative bg-primary text-white py-24 overflow-hidden" style={{ minHeight: '520px' }}>
            <div className="container mx-auto px-4 relative z-10">
              <div className="flex flex-col lg:flex-row items-center">
                {/* Text content skeleton */}
                <div className="lg:w-1/2 text-center lg:text-left">
                  <div className="inline-block w-48 h-6 bg-white bg-opacity-20 rounded-full mb-4"></div>
                  <div className="h-12 w-full max-w-md bg-white bg-opacity-20 rounded-lg mb-4 animate-pulse"></div>
                  <div className="h-12 w-3/4 max-w-md bg-white bg-opacity-20 rounded-lg mb-8 animate-pulse"></div>
                  <div className="h-8 w-1/2 max-w-md bg-white bg-opacity-20 rounded-lg mb-6 animate-pulse"></div>
                  <div className="flex justify-center lg:justify-start">
                    <div className="h-12 w-40 bg-white bg-opacity-20 rounded-lg animate-pulse"></div>
                  </div>
                </div>
                
                {/* Image skeleton */}
                <div className="lg:w-1/2 mt-10 lg:mt-0">
                  <div className="relative mx-auto max-w-md">
                    <div className="w-full h-64 bg-white bg-opacity-20 rounded-xl animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Dark curved bottom edge */}
            <div className="absolute bottom-0 left-0 right-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" fill="#0a0a0a">
                <path d="M0,64L60,69.3C120,75,240,85,360,90.7C480,96,600,96,720,85.3C840,75,960,53,1080,48C1200,43,1320,53,1380,58.7L1440,64L1440,100L1380,100C1320,100,1200,100,1080,100C960,100,840,100,720,100C600,100,480,100,360,100C240,100,120,100,60,100L0,100Z"></path>
              </svg>
            </div>
          </div>

          {/* Features Section Skeleton */}
          <div className="container mx-auto py-16">
            <div className="h-10 w-64 bg-gray-200 rounded-lg mx-auto mb-12 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="h-20 w-20 bg-gray-200 rounded-full mb-4 animate-pulse"></div>
                  <div className="h-6 w-32 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
                  <div className="h-20 w-full bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works Section Skeleton */}
          <div className="bg-gradient-to-b from-gray-900 to-gray-800 py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center mb-16">
                <div className="h-6 w-36 bg-white bg-opacity-20 rounded-full mb-4 mx-auto animate-pulse"></div>
                <div className="h-10 w-64 bg-white bg-opacity-20 rounded-lg mx-auto mb-4 animate-pulse"></div>
                <div className="w-24 h-1 bg-white bg-opacity-20 mx-auto rounded-full mb-6"></div>
                <div className="h-6 w-full max-w-md bg-white bg-opacity-20 rounded-lg mx-auto animate-pulse"></div>
              </div>
              
              <div className="relative">
                {/* Connection line skeleton */}
                <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-primary bg-opacity-20 transform -translate-y-1/2 z-0"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="text-center">
                      <div className="bg-gray-800 rounded-xl shadow-xl p-8 border border-gray-700 h-full flex flex-col">
                        <div className="relative mb-6 mx-auto">
                          <div className="w-20 h-20 bg-primary bg-opacity-30 rounded-full animate-pulse"></div>
                        </div>
                        <div className="h-6 w-32 bg-white bg-opacity-20 rounded-lg mb-4 mx-auto animate-pulse"></div>
                        <div className="h-20 w-full bg-white bg-opacity-10 rounded-lg animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : status === 'authenticated' ? (
        // Redesigned Welcome Back Hero Section (matching size with non-logged in section)
        <div className="relative bg-primary text-white py-24 overflow-hidden">
          {/* Abstract background shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white opacity-10 rounded-full animate-float"></div>
            <div className="absolute top-40 -left-20 w-96 h-96 bg-white opacity-5 rounded-full animate-float-slow"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-white opacity-10 rounded-full animate-float-reverse"></div>
            <div className="hidden md:block absolute -bottom-20 left-1/4 w-72 h-72 bg-white opacity-5 rounded-full animate-pulse-slow"></div>
          </div>
          
          {/* Content container with centered profile */}
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col items-center justify-center text-center mb-6">
              {/* Welcome badge */}
              <div className="inline-block px-4 py-1 rounded-full bg-white bg-opacity-20 mb-6 animate-slide-up">
                <span className="text-sm font-medium">Welcome Back</span>
              </div>
              
              {/* Profile Image - Centered */}
              <div className="mb-6 animate-fade-in">
                <div className="relative mx-auto">
                  <div className="w-28 h-28 rounded-full bg-white bg-opacity-20 border-4 border-white border-opacity-30 overflow-hidden shadow-2xl mx-auto transform hover:scale-105 transition-transform duration-500">
                    {session?.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'Profile'}
                        width={112}
                        height={112}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold bg-primary-light">
                        {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute -right-2 -bottom-2 w-8 h-8 bg-white bg-opacity-20 rounded-lg animate-float hidden sm:block"></div>
                  <div className="absolute -left-4 top-1/2 w-6 h-6 bg-white bg-opacity-30 rounded-full animate-float-reverse hidden sm:block"></div>
                </div>
              </div>
              
              {/* Text content */}
              <div className="animate-fade-in max-w-2xl mx-auto">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-poppins animate-slide-up leading-tight">
                  Hello, <span className="text-yellow-300">{session?.user?.name?.split(' ')[0]}</span>!
                </h1>
                <p className="text-lg md:text-xl mb-8 animate-slide-up animation-delay-200 max-w-md mx-auto opacity-90">
                  Ready to continue your learning journey? Connect with others to grow your skills today.
                </p>
                
                {/* Action buttons - UPDATED TEXT COLOR FOR BETTER VISIBILITY */}
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 justify-center">
                  <Link
                    href="/connect"
                    className="inline-block bg-white text-primary px-6 py-3 rounded-lg font-semibold text-base border-2 border-white hover:bg-transparent hover:text-white transition-all duration-300 shadow-lg transform hover:scale-105 animate-bounce-in animation-delay-400"
                  >
                    Continue Learning
                  </Link>
                  <Link
                    href="/profile"
                    className="inline-block bg-transparent text-white px-6 py-3 rounded-lg font-semibold text-base border-2 border-white hover:bg-white hover:text-black transition-all duration-300 shadow-lg transform hover:scale-105 animate-bounce-in animation-delay-600"
                  >
                    Profile Setup
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-block bg-transparent text-white px-6 py-3 rounded-lg font-semibold text-base border-2 border-white hover:bg-white hover:text-black transition-all duration-300 shadow-lg transform hover:scale-105 animate-bounce-in animation-delay-800"
                  >
                    View Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dark curved bottom edge */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" fill="#0a0a0a">
              <path d="M0,64L60,69.3C120,75,240,85,360,90.7C480,96,600,96,720,85.3C840,75,960,53,1080,48C1200,43,1320,53,1380,58.7L1440,64L1440,100L1380,100C1320,100,1200,100,1080,100C960,100,840,100,720,100C600,100,480,100,360,100C240,100,120,100,60,100L0,100Z"></path>
            </svg>
          </div>
        </div>
      ) : (
        // Original Hero Section for non-logged-in users
        <div className="relative bg-primary text-white py-24 overflow-hidden">
          {/* Abstract background shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white opacity-10 rounded-full animate-float"></div>
            <div className="absolute top-40 -left-20 w-96 h-96 bg-white opacity-5 rounded-full animate-float-slow"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-white opacity-10 rounded-full animate-float-reverse"></div>
            <div className="hidden md:block absolute -bottom-20 left-1/4 w-72 h-72 bg-white opacity-5 rounded-full animate-pulse-slow"></div>
          </div>
          
          {/* Content container with improved layout */}
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center">
              {/* Text content with enhanced animations */}
              <div className="lg:w-1/2 text-center lg:text-left animate-fade-in">
                <div className="inline-block px-4 py-1 rounded-full bg-white bg-opacity-20 mb-4 animate-slide-up">
                  <span className="text-sm font-medium">A new way to build your skills</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-poppins animate-slide-up leading-tight">
                  Connect, <span className="relative inline-block">
                    Learn <span className="absolute -bottom-1 left-0 w-full h-1 bg-white animate-pulse" ></span>
                  </span>, and Grow with SkillConnect
                </h1>
                <p className="text-lg md:text-xl mb-8 animate-slide-up animation-delay-200 max-w-md mx-auto lg:mx-0 opacity-90">
                  Join a community of learners and mentors to share skills, knowledge, and experiences in a collaborative environment.
                </p>
                <div className="flex justify-center lg:justify-start">
                  <Link
                    href="/connect"
                    className="inline-block bg-white text-primary px-8 py-4 rounded-lg font-semibold border-2 border-white hover:bg-transparent hover:text-white transition duration-300 animate-bounce-in animation-delay-400"
                  >
                    Start Connecting
                  </Link>
                </div>
              </div>
              
              {/* Image/Illustration side */}
              <div className="lg:w-1/2 mt-10 lg:mt-0 animate-fade-in animation-delay-400">
                <div className="relative mx-auto max-w-md">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-light opacity-50 animate-pulse-slow rounded-xl"></div>
                  <Image
                    src="/ppl.png" 
                    alt="People connecting and learning"
                    width={500}
                    height={400}
                    className="relative z-10 rounded-xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white bg-opacity-20 rounded-lg animate-float"></div>
                  <div className="absolute -left-6 top-1/2 w-12 h-12 bg-white bg-opacity-30 rounded-full animate-float-reverse"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dark curved bottom edge that transitions to the dark background */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" fill="#0a0a0a"> {/* Using dark color instead of white */}
              <path d="M0,64L60,69.3C120,75,240,85,360,90.7C480,96,600,96,720,85.3C840,75,960,53,1080,48C1200,43,1320,53,1380,58.7L1440,64L1440,100L1380,100C1320,100,1200,100,1080,100C960,100,840,100,720,100C600,100,480,100,360,100C240,100,120,100,60,100L0,100Z"></path>
            </svg>
          </div>
        </div>
      )}
      
      {/* Features Section with staggered fade-in */}
      <div ref={featuresRef} className="container mx-auto py-16 opacity-0 transition-all duration-1000 transform translate-y-10">
        <h2 className="text-3xl font-bold text-center mb-12 font-poppins text-foreground">
          Why Choose SkillConnect?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: "/skill-sharing.png",
              title: "Skill Sharing",
              description: "Share your skills and learn from others in a collaborative environment."
            },
            {
              icon: "/community-driven.png",
              title: "Community Driven",
              description: "Be part of a supportive community that values knowledge sharing and growth."
            },
            {
              icon: "/peer-to-peer.png",
              title: "Peer to Peer Learning",
              description: "Our system is built on peer-to-peer learning, enabling direct knowledge exchange."
            }
          ].map((feature, index) => (
            <div key={index} className={`text-center transform transition-all duration-700 delay-${index * 200} hover:scale-105`}>
              <div className="h-20 relative mb-4">
                <Image
                  src={feature.icon}
                  alt={feature.title}
                  width={80}
                  height={80}
                  className="mx-auto"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-white-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* IMPROVED How It Works Section */}
      <div ref={howItWorksRef} className="bg-gradient-to-b from-gray-900 to-gray-800 py-20 opacity-0 transition-all duration-1000 transform translate-y-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-primary bg-opacity-20 text-primary mb-4">
              <span className="text-sm font-medium text-white">Simple Process</span>
            </span>
            <h2 className="text-4xl font-bold text-white mb-4 font-poppins">
              How It Works
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-6"></div>
            <p className="text-gray-300 text-lg">
              Our process makes it easy to start learning and sharing skills
            </p>
          </div>
          
          <div className="relative">
            {/* Connection line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-primary bg-opacity-20 transform -translate-y-1/2 z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {[
                {
                  step: 1,
                  title: "Select Your Skills",
                  description: "Choose the skills you want to learn or teach. You can select multiple skills to expand your opportunities.",
                  icon: "/select-icon.png",
                  ref: step1Ref
                },
                {
                  step: 2,
                  title: "Get Matched",
                  description: "Our intelligent system matches you with others based on your selected skills and learning preferences.",
                  icon: "/match-icon.png",
                  ref: step2Ref
                },
                {
                  step: 3,
                  title: "Start Learning",
                  description: "Connect with your match and begin your learning journey. Share knowledge, collaborate, and grow together.",
                  icon: "/learn-icon.png",
                  ref: step3Ref
                }              
              ].map((step, index) => (
                <div 
                  key={index} 
                  className="text-center opacity-0 scale-0" 
                  ref={step.ref}
                >
                  <div className="group bg-gray-800 rounded-xl shadow-xl p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:bg-gray-750 border border-gray-700 h-full flex flex-col">
                    <div className="relative mb-6 mx-auto">
                      <div className="w-20 h-20 flex items-center justify-center bg-gradient-to-br from-primary to-primary-light text-white rounded-full text-3xl font-bold group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="text-2xl font-semibold mb-4 text-white group-hover:text-primary transition-colors">{step.title}</h3>
                    <p className="text-gray-300 flex-grow">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* IMPROVED Call-to-Action Section with Animation - Only shown if NOT signed in */}
      {!isLoading && status === 'unauthenticated' && (
        <div ref={signUpRef} className="relative py-20 overflow-hidden opacity-0 transition-all duration-1000 transform translate-y-10">
          {/* Background gradient and shapes */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark z-0">
            <div className="absolute top-0 left-0 w-full h-full bg-pattern opacity-10"></div>
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-white opacity-5 rounded-full animate-float-slow"></div>
            <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-white opacity-5 rounded-full animate-float"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl p-10 shadow-2xl border border-white border-opacity-20 sign-up-card opacity-0 transform scale-95">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div className="sign-up-content opacity-0 transform translate-y-10">
                  <h2 className="text-4xl font-bold mb-6 text-white font-poppins leading-tight">
                    Ready to Get <span className="text-yellow-300">Started</span>?
                  </h2>
                  <p className="text-xl mb-8 text-white text-opacity-90">
                    Join SkillConnect today and discover a new way to grow your skills.
                  </p>
                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <Link
                      href="/signup"
                      className="inline-block bg-white text-primary px-8 py-4 rounded-lg font-semibold text-lg border-2 border-white hover:bg-transparent hover:text-white transition-all duration-300 shadow-lg transform hover:scale-105"
                    >
                      Sign Up Now
                    </Link>
                  </div>
                </div>
                <div className="hidden md:block sign-up-image opacity-0 transform translate-x-10">
                  <div className="relative">
                    {/* Decorative elements */}
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-300 bg-opacity-20 rounded-lg animate-float"></div>
                    <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary-light bg-opacity-30 rounded-full animate-float-reverse"></div>
                    
                    {/* Illustration container */}
                    <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20 shadow-lg">
                      <Image
                        src="/111.png" 
                        alt="People connecting"
                        width={400}
                        height={300}
                        className="rounded-lg shadow-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add a simple info section at the bottom for signed-in users */}
      {!isLoading && status === 'authenticated' && (
        <div className="relative py-16 overflow-hidden">
          {/* Background gradient and shapes */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark z-0">
            <div className="absolute top-0 left-0 w-full h-full bg-pattern opacity-10"></div>
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-white opacity-5 rounded-full animate-float-slow"></div>
            <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-white opacity-5 rounded-full animate-float"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div ref={infoSectionRef} className="max-w-4xl mx-auto opacity-0 transition-all duration-1000 transform translate-y-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
                Getting the Most Out of SkillConnect
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Complete Your Profile",
                    description: "Add your skills and interests to help us match you with the right learning partners."
                  },
                  {
                    title: "Connect Regularly",
                    description: "Make time for regular learning sessions to build momentum and see real progress."
                  },
                  {
                    title: "Share Your Knowledge",
                    description: "Remember that teaching is one of the most effective ways to strengthen your own skills."
                  }
                ].map((item, index) => (
                  <div 
                    key={index} 
                    className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-sm p-6 rounded-lg shadow-lg border border-white border-opacity-20 transform transition-all duration-700 hover:translate-y--2 hover:shadow-2xl card-animate-item"
                    style={{animationDelay: `${index * 200}ms`}}
                  >
                    <h3 className="text-xl font-semibold text-white mb-4">{item.title}</h3>
                    <p className="text-white text-opacity-90">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add global styles for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slideLeft {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes bounceIn {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }
        
        .animate-slide-up {
          opacity: 0;
          animation: slideUp 0.8s ease-out forwards;
        }
        
        .animate-bounce-in {
          opacity: 0;
          animation: bounceIn 0.8s ease-out forwards;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        
        .step-animate-in {
          animation: popIn 0.6s ease-out forwards;
        }
        
        /* Card animation for info section */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .card-animate-item {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        /* Sign-up section specific animations */
        .sign-up-animate-in {
          animation: scaleIn 0.8s ease-out forwards;
        }
        
        .sign-up-content-animate-in {
          animation: slideUp 0.8s ease-out forwards;
        }
        
        .sign-up-image-animate-in {
          animation: slideLeft 0.8s ease-out forwards;
        }
        
        .counter-animation {
          opacity: 0;
          animation: fadeIn 0.8s ease-out forwards;
          animation-delay: 0.2s;
        }
          @keyframes float {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        
        @keyframes floatSlow {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(-5deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        
        @keyframes floatReverse {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(15px) rotate(-5deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        
        @keyframes pulseSlow {
          0% { opacity: 0.5; }
          50% { opacity: 0.2; }
          100% { opacity: 0.5; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: floatSlow 8s ease-in-out infinite;
        }
        
        .animate-float-reverse {
          animation: floatReverse 7s ease-in-out infinite; 
        }
        
        .animate-pulse-slow {
          animation: pulseSlow 4s ease-in-out infinite;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        
        .animation-delay-800 {
          animation-delay: 0.8s;
        }
        
        /* Add a subtle background pattern */
        .bg-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  );
}