'use client'

import Link from 'next/link'
import Image from 'next/image'
import { UserCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function Header() {
  return (
    <header className="bg-white text-gray-800 p-4 shadow-md">
      <div className="container mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <div className="flex items-center space-x-3">
          <Image
            src="https://dopeproject.org/program_logos/dopeproject250x250.png"
            alt="DOPE Project Logo"
            width={50}
            height={50}
            className="object-contain"
          />
          <h1 className="text-xl font-bold">DOPE Data Dashboard</h1>
        </div>
        <div className="flex justify-center">
          <nav>
            <ul className="flex items-center space-x-8">
              <li>
                <Link 
                  href="/" 
                  className="px-3 py-2 rounded-md transition-all duration-200 
                    hover:text-blue-500 
                    border-b-2 border-transparent hover:border-blue-100"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/program-dashboard" 
                  className="px-3 py-2 rounded-md transition-all duration-200 
                    hover:text-blue-500 
                    border-b-2 border-transparent hover:border-blue-100"
                >
                  Program Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  href="/programs" 
                  className="px-3 py-2 rounded-md transition-all duration-200 
                    hover:text-blue-500 
                    border-b-2 border-transparent hover:border-blue-100"
                >
                  Programs
                </Link>
              </li>
              <li>
                <Link 
                  href="/simple-query" 
                  className="px-3 py-2 rounded-md transition-all duration-200 
                    hover:text-blue-500 
                    border-b-2 border-transparent hover:border-blue-100"
                >
                  Simple Query
                </Link>
              </li>
              <li>
                <Link 
                  href="/public-dashboard" 
                  className="px-3 py-2 rounded-md transition-all duration-200 
                    hover:text-blue-500 
                    border-b-2 border-transparent hover:border-blue-100"
                >
                  Public Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin" 
                  className="px-3 py-2 rounded-md transition-all duration-200 
                    hover:text-blue-500 
                    border-b-2 border-transparent hover:border-blue-100"
                >
                  Admin
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="flex items-center justify-end space-x-4">
          <Button variant="outline" className="hover:text-blue-500 transition-colors">
            Sign Up
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600 transition-colors">
            Log In
          </Button>
          <UserCircle className="h-6 w-6 text-gray-600 hover:text-blue-500 transition-colors" />
        </div>
      </div>
    </header>
  )
}

