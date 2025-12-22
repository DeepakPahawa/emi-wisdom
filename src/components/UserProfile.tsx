"use client"

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, User as UserIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function UserProfile() {
    const { user, signOut, loading } = useAuth()
    const router = useRouter()

    const handleSignOut = async () => {
        const { error } = await signOut()
        if (error) {
            console.error('Error signing out:', error.message)
            alert('Failed to sign out. Please try again.')
        } else {
            router.push('/login')
        }
    }

    if (loading) {
        return (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        )
    }

    if (!user) {
        return (
            <Button
                onClick={() => router.push('/login')}
                variant="default"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20"
            >
                Sign In
            </Button>
        )
    }

    const userInitials = user.user_metadata?.full_name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-blue-500 dark:border-blue-400 shadow-lg">
                        <AvatarImage
                            src={user.user_metadata?.avatar_url}
                            alt={user.user_metadata?.full_name || user.email || 'User'}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                            {userInitials}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {user.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                    onClick={handleSignOut}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
