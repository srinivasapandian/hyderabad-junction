import './CategoryTitle.css';

interface CategoryTitleProps {
  children: React.ReactNode;
  className?: string;
}

function CategoryTitle({ children, className = '' }: CategoryTitleProps) {
  return (
    <h2 className={`category-title${className ? ` ${className}` : ''}`}>
      {children}
    </h2>
  );
}

export default CategoryTitle;
