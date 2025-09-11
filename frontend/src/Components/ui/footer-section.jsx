"use client"

import * as React from "react"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/Components/ui/tooltip"
import { Facebook, Instagram, Linkedin, Send, Twitter } from "lucide-react"

function Footerdemo() {
  // Ensure light mode is always active
  React.useEffect(() => {
    document.documentElement.classList.remove("dark")
  }, [])

  return (
    <footer className="relative border-t border-gray-200 text-gray-900 transition-colors duration-300" style={{ backgroundColor: '#f7f7f7' }}>
      <div className="container mx-auto px-4 pt-16 pb-12 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900">Stay Connected</h2>
            <p className="mb-6 text-gray-600">
              Join our newsletter for the latest updates and exclusive offers.
            </p>
            <form className="relative">
              <Input
                type="email"
                placeholder="Enter your email"
                className="pr-12 backdrop-blur-sm bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8 rounded-full bg-blue-600 text-white transition-transform hover:scale-105 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Subscribe</span>
              </Button>
            </form>
            <div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-blue-100 blur-2xl" />
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Links</h3>
            <nav className="space-y-2 text-sm">
              <a href="https://github.com" className="block transition-colors hover:text-blue-600 text-gray-600">
                Changelog
              </a>
            </nav>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Contact Us</h3>
            <address className="space-y-2 text-sm not-italic text-gray-600">
              <p>123 Innovation Street</p>
              <p>Tech City, TC 12345</p>
              <p>Phone: (123) 456-7890</p>
              <p>Email: hello@example.com</p>
            </address>
          </div>
          <div className="relative">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Follow Us</h3>
            <div className="mb-6 flex gap-6">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400" style={{ borderRadius: '40px' }}>
                      <Facebook className="h-4 w-4" />
                      <span className="sr-only">Facebook</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Follow us on Facebook</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400" style={{ borderRadius: '40px' }}>
                      <Twitter className="h-4 w-4" />
                      <span className="sr-only">Twitter</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Follow us on Twitter</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400" style={{ borderRadius: '40px' }}>
                      <Instagram className="h-4 w-4" />
                      <span className="sr-only">Instagram</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Follow us on Instagram</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400" style={{ borderRadius: '40px' }}>
                      <Linkedin className="h-4 w-4" />
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Connect with us on LinkedIn</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 text-center md:flex-row">
          <p className="text-sm text-gray-600">
            © 2024 Your Company. All rights reserved.
          </p>
          <nav className="flex gap-4 text-sm">
            <a href="#" className="transition-colors hover:text-blue-600 text-gray-600">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-blue-600 text-gray-600">
              Terms of Service
            </a>
            <a href="#" className="transition-colors hover:text-blue-600 text-gray-600">
              Cookie Settings
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export { Footerdemo }
