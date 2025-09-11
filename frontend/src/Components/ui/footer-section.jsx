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
import { Instagram, Linkedin, Send, Globe, Mail } from "lucide-react"

function Footerdemo() {
  // Ensure light mode is always active
  React.useEffect(() => {
    document.documentElement.classList.remove("dark")
  }, [])

  return (
    <footer className="relative border-t border-gray-200 text-gray-900 transition-colors duration-300" style={{ backgroundColor: '#f7f7f7' }}>
      <div className="container mx-auto px-4 md:px-6 lg:px-8" style={{ paddingTop: '2rem' }}>
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900">Having Trouble?</h2>
            <p className="mb-6 text-gray-600">
              Questions or problems with the app? Don’t hesitate to reach out.
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
            <h3 className="mb-4 text-3xl font-bold tracking-tight text-gray-900">Quick Links</h3>
            <nav className="text-sm">
              <a href="https://www.180dc.org/branches/sheffield" className="block transition-colors hover:text-blue-600 text-gray-600 mb-2">
                About Us
              </a>
              <a href="https://github.com/bashirbobboi/180Connect/commits/main/" className="block transition-colors hover:text-blue-600 text-gray-600">
                Changelog
              </a>
            </nav>
          </div>
          <div>
            <h3 className="mb-4 text-3xl font-bold tracking-tight text-gray-900">Contact Us</h3>
            <address className="space-y-1 text-sm not-italic text-gray-600">
              <p>82 Upper Allen St, Sheffield,</p>
              <p>South Yorkshire, United Kingdom.</p>
              <p>S3 7NU</p>
              <p>Phone: (123) 456-7890</p>
              <p>Email: sheffield@180dc.org</p>
            </address>
          </div>
          <div className="relative">
            <h3 className="mb-4 text-3xl font-bold tracking-tight text-gray-900">Follow Us</h3>
            <div className="mb-6 flex gap-6">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400" style={{ borderRadius: '40px' }} onClick={() => window.open('https://www.instagram.com/180dcsheffield?igsh=N3o5NHUwY2kwM3k0', '_blank')}>
                      <Instagram className="h-4 w-4" />
                      <span className="sr-only">Instagram</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={2} style={{ paddingTop: '4px', paddingBottom: '1px', lineHeight: '1.2' }}>
                    Follow us on Instagram
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400" style={{ borderRadius: '40px' }} onClick={() => window.open('https://www.linkedin.com/company/180dcsheffield/', '_blank')}>
                      <Linkedin className="h-4 w-4" />
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={2} style={{ paddingTop: '4px', paddingBottom: '1px', lineHeight: '1.2' }}>
                    Connect with us on LinkedIn
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400" style={{ borderRadius: '40px' }} onClick={() => window.open('https://www.180dc.org/', '_blank')}>
                      <Globe className="h-4 w-4" />
                      <span className="sr-only">Website</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={2} style={{ paddingTop: '4px', paddingBottom: '1px', lineHeight: '1.2' }}>
                    Visit our website
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400" style={{ borderRadius: '40px' }} onClick={() => window.open('mailto:sheffield@180dc.org', '_blank')}>
                      <Mail className="h-4 w-4" />
                      <span className="sr-only">Email</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={2} style={{ paddingTop: '4px', paddingBottom: '1px', lineHeight: '1.2' }}>
                    Email us
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400" style={{ borderRadius: '40px' }} onClick={() => window.open('https://linktr.ee/180dcsheffield', '_blank')}>
                      <i className="fa-brands fa-linktree" style={{ fontSize: '16px' }}></i>
                      <span className="sr-only">Linktree</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={2} style={{ paddingTop: '4px', paddingBottom: '1px', lineHeight: '1.2' }}>
                    Visit our Linktree
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 text-center md:flex-row" style={{ paddingTop: '2rem' }}>
          <p className="text-sm text-gray-600">
            ©2025 180 Degrees Consulting. All rights reserved.
          </p>
          {/* <nav className="flex gap-4 text-sm">
            <a href="#" className="transition-colors hover:text-blue-600 text-gray-600">
              Privacy Policy
            </a>
            <a href="/terms-of-service" className="transition-colors hover:text-blue-600 text-gray-600">
              Terms of Service
            </a>
            <a href="#" className="transition-colors hover:text-blue-600 text-gray-600">
              Cookie Settings
            </a>
          </nav> */}
        </div>
      </div>
    </footer>
  )
}

export { Footerdemo }
