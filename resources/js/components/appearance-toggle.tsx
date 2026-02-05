import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppearance } from '@/hooks/use-appearance';

export function AppearanceToggle() {
    const { appearance, updateAppearance } = useAppearance();

    const getIcon = () => {
        switch (appearance) {
            case 'light':
                return <Sun className="h-4 w-4" />;
            case 'dark':
                return <Moon className="h-4 w-4" />;
            default:
                return <Monitor className="h-4 w-4" />;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    {getIcon()}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => updateAppearance('light')}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateAppearance('dark')}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateAppearance('system')}>
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>System</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
