"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Breadcrumb() {
  const pathname = usePathname();

  // Skip breadcrumb for home page
  if (pathname === "/") return null;

  // Generate breadcrumb items from pathname
  const breadcrumbs = pathname
    .split("/")
    .filter((path) => path)
    .map((path, index, array) => {
      // Create the full path for this breadcrumb
      const href = "/" + array.slice(0, index + 1).join("/");
      
      // Format the path for display
      const label = path
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      return {
        href,
        label,
        isLast: index === array.length - 1,
      };
    });

  return (
    <div className="bg-gray-50 py-4">
      <div className="container mx-auto px-4">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link
                href="/"
                className="text-gray-500 hover:text-accent-color transition-colors flex items-center"
              >
                <i className="fas fa-home mr-2"></i>
                Home
              </Link>
            </li>
            {breadcrumbs.map((breadcrumb, index) => (
              <li key={breadcrumb.href} className="flex items-center">
                <i className="fas fa-chevron-right text-gray-400 mx-2"></i>
                {breadcrumb.isLast ? (
                  <span className="text-accent-color font-medium">
                    {breadcrumb.label}
                  </span>
                ) : (
                  <Link
                    href={breadcrumb.href}
                    className="text-gray-500 hover:text-accent-color transition-colors"
                  >
                    {breadcrumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
} 