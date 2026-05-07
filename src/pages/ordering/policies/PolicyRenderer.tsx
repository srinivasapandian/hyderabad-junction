interface ParagraphBlock {
  type: 'paragraph';
  text: string;
}

interface ListBlock {
  type: 'list';
  items: string[];
}

type PolicyBlock = ParagraphBlock | ListBlock;

interface PolicySection {
  heading: string;
  blocks: PolicyBlock[];
}

export interface PolicyDocument {
  effectiveDate: string;
  intro: string;
  sections: PolicySection[];
}

interface PolicyRendererProps {
  doc: PolicyDocument;
}

export default function PolicyRenderer({ doc }: PolicyRendererProps) {
  return (
    <>
      <p className="policies-effective">Effective Date: {doc.effectiveDate}</p>
      <p className="policies-intro">{doc.intro}</p>

      {doc.sections.map((section) => (
        <div key={section.heading} className="policies-section">
          <h3>{section.heading}</h3>
          {section.blocks.map((block, idx) => {
            if (block.type === 'list') {
              return (
                <ul key={idx} className="policies-list">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              );
            }
            return <p key={idx}>{block.text}</p>;
          })}
        </div>
      ))}
    </>
  );
}
