import './CategoryTitle.css';
import trainImg from '../../assets/train.png';

interface CategoryTitleProps {
  children: React.ReactNode;
  className?: string;
}

function CategoryTitle({ children, className = '' }: CategoryTitleProps) {
  return (
    <h2 className={`category-title${className ? ` ${className}` : ''}`}>
      <span className="category-title-text">{children}</span>
      <img src={trainImg} alt="" aria-hidden="true" className="category-train" />
    </h2>
  );
}

export default CategoryTitle;
