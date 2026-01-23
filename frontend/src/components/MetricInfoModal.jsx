import { factorDefinitions, parameterGuidance } from '../constants/evaluationData';

export default function MetricInfoModal({ onClose, type }) {
  const getModalTitle = () => {
    switch (type) {
      case 'problem':
        return 'Business Problem Guide';
      case 'solution':
        return 'Business Solution Guide';
      case 'factors':
        return 'Evaluation Factors';
      default:
        return 'Guide';
    }
  };

  const getModalContent = () => {
    switch (type) {
      case 'problem':
        return <ProblemGuide />;
      case 'solution':
        return <SolutionGuide />;
      case 'factors':
        return <FactorsGuide />;
      default:
        if (parameterGuidance[type]) {
          return <ParameterDetailGuide paramKey={type} />;
        }
        return <DescriptionGuide />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{getModalTitle()}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">{getModalContent()}</div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 700px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #eee;
        }
        .modal-header h2 {
          margin: 0;
          color: #34a83a;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        .modal-close:hover {
          background: #f5f5f5;
          color: #333;
        }
        .modal-body {
          padding: 24px;
        }
      `}</style>
    </div>
  );
}

function ProblemGuide() {
  return (
    <div>
      <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
        Describe the <strong>environmental or circular economy challenge</strong> your business
        addresses. This should be a clear, quantified problem statement that demonstrates
        understanding of the issue's scope and impact.
      </p>

      <div
        style={{
          background: '#f5f5f5',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h4 style={{ margin: '0 0 12px 0', color: '#34a83a' }}>Essential Elements to Include:</h4>
        <ul style={{ paddingLeft: '24px', lineHeight: '1.8', margin: 0 }}>
          <li>
            <strong>Environmental Impact:</strong> Specific waste, pollution, or resource depletion
            issue (e.g., "8M tons of plastic waste entering oceans annually")
          </li>
          <li>
            <strong>Quantified Scale:</strong> Use real numbers, percentages, or measurements to
            show magnitude (tons, percentage of market, number of people affected)
          </li>
          <li>
            <strong>Current Gaps:</strong> Why existing solutions fail (cost barriers,
            infrastructure limitations, behavioral challenges, regulatory issues)
          </li>
          <li>
            <strong>Stakeholders Affected:</strong> Who experiences this problem and how (consumers,
            businesses, communities, ecosystems)
          </li>
          <li>
            <strong>Geographic Context:</strong> Where is this problem most acute? (local, regional,
            national, global)
          </li>
          <li>
            <strong>Urgency Indicators:</strong> Why this problem needs solving now (regulatory
            pressure, market demand, environmental tipping points)
          </li>
        </ul>
      </div>

      <div
        style={{
          background: '#e3f2fd',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h4 style={{ margin: '0 0 12px 0', color: '#4a90e2' }}>Writing Tips:</h4>
        <ul style={{ paddingLeft: '24px', lineHeight: '1.8', margin: 0 }}>
          <li>Start with a compelling statistic or fact</li>
          <li>Use specific numbers rather than vague terms ("30% waste" not "lots of waste")</li>
          <li>Connect the problem to economic or social costs</li>
          <li>Reference industry standards or regulations where relevant</li>
          <li>Cite sources if you have them ("According to EPA...", "Industry studies show...")</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#4a90e2' }}>Example Problem Statement:</h4>
        <p
          style={{
            fontStyle: 'italic',
            color: '#555',
            lineHeight: '1.6',
            padding: '12px',
            background: '#e3f2fd',
            borderRadius: '6px',
          }}
        >
          "Single-use plastic packaging creates 8 million tons of ocean waste annually, depleting
          marine ecosystems and poisoning food chains. Current alternatives are either
          cost-prohibitive (&gt;$2/unit) or require complex industrial composting infrastructure
          unavailable to 75% of municipalities. This creates a critical gap between consumer demand
          for sustainable packaging and practical implementation at scale."
        </p>
      </div>

      <p style={{ marginTop: '16px', fontStyle: 'italic', color: '#666' }}>
        <strong>Minimum 200 characters required</strong> for accurate database matching and AI
        analysis.
      </p>
    </div>
  );
}

function SolutionGuide() {
  return (
    <div>
      <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
        Describe <strong>how your business solves the problem</strong> with a detailed, technical
        explanation of your circular economy approach. Be specific about materials, processes,
        partnerships, and measurable outcomes.
      </p>

      <div
        style={{
          background: '#f5f5f5',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h4 style={{ margin: '0 0 12px 0', color: '#34a83a' }}>Critical Components to Address:</h4>
        <ul style={{ paddingLeft: '24px', lineHeight: '1.8', margin: 0 }}>
          <li>
            <strong>Materials & Inputs:</strong> Exact materials used with specifications
            ("post-consumer PET bottles," "Grade A agricultural hemp fiber," "certified recycled
            aluminum - ISO 14021")
          </li>
          <li>
            <strong>Process & Technology:</strong> Step-by-step transformation process, equipment
            used, technical standards met ("mechanical sorting → washing → pelletizing at 230°C")
          </li>
          <li>
            <strong>Business Model & Logistics:</strong> How you collect, process, and distribute
            (hub-and-spoke, DaaS model, reverse logistics network, collection points)
          </li>
          <li>
            <strong>Circularity Loop:</strong> Precise description of how materials return to use
            ("composted material sold to organic farms → used to grow hemp → hemp becomes packaging
            → cycle repeats")
          </li>
          <li>
            <strong>Key Performance Metrics:</strong> Quantified results ("95% recovery rate,"
            "$0.85/unit at 10K scale," "180-day home composting," "30% lower carbon footprint vs
            virgin materials")
          </li>
          <li>
            <strong>Partnerships & Infrastructure:</strong> Key collaborators (waste management
            companies, processing facilities, certification bodies, distribution channels)
          </li>
          <li>
            <strong>Scalability Path:</strong> How the solution grows (pilot → regional → national,
            target: X units/month by Year 2)
          </li>
          <li>
            <strong>Economic Viability:</strong> Revenue model, cost structure, price point
            comparison to conventional alternatives
          </li>
        </ul>
      </div>

      <div
        style={{
          background: '#fff3e0',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h4 style={{ margin: '0 0 12px 0', color: '#ff9800' }}>Common Pitfalls to Avoid:</h4>
        <ul style={{ paddingLeft: '24px', lineHeight: '1.8', margin: 0 }}>
          <li>
            ❌ Vague descriptions ("We recycle plastic" → ✅ "We convert HDPE milk jugs into outdoor
            furniture lumber")
          </li>
          <li>
            ❌ Missing technical details ("special process" → ✅ "enzymatic depolymerization at
            60°C, 4-hour cycle")
          </li>
          <li>
            ❌ No metrics ("high efficiency" → ✅ "87% material recovery, 92% energy efficiency vs
            thermal processing")
          </li>
          <li>
            ❌ Unclear loop closure ("reuse materials" → ✅ "fiber returned to textile manufacturers
            for new garment production")
          </li>
        </ul>
      </div>

      <div
        style={{
          background: '#e8f5e9',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h4 style={{ margin: '0 0 12px 0', color: '#34a83a' }}>Pro Tips for Strong Solutions:</h4>
        <ul style={{ paddingLeft: '24px', lineHeight: '1.8', margin: 0 }}>
          <li>✓ Use industry-standard terminology and certifications</li>
          <li>✓ Include both environmental AND economic metrics</li>
          <li>✓ Mention regulatory compliance (FDA, EPA, ISO standards)</li>
          <li>✓ Compare to conventional alternatives (cost, performance, environmental impact)</li>
          <li>
            ✓ Show real-world validation (pilot results, customer testimonials, third-party testing)
          </li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#4a90e2' }}>Example Solution Statement:</h4>
        <p
          style={{
            fontStyle: 'italic',
            color: '#555',
            lineHeight: '1.6',
            padding: '12px',
            background: '#e3f2fd',
            borderRadius: '6px',
          }}
        >
          "Our platform uses compostable packaging from agricultural hemp waste, combined with a
          hub-and-spoke collection model. Customers receive pre-addressed, compostable mailers; we
          aggregate returns at 15 regional hubs; certified composting facilities process 95% of
          materials within 90 days into soil amendments. These amendments are sold back to hemp
          farms, creating a closed loop. Cost: $0.85/unit at scale, home-compostable in 180 days."
        </p>
      </div>

      <p style={{ marginTop: '16px', fontStyle: 'italic', color: '#666' }}>
        <strong>Minimum 200 characters required</strong> for accurate database matching and AI
        analysis.
      </p>
    </div>
  );
}

function DescriptionGuide() {
  return (
    <div>
      <p style={{ marginBottom: '16px' }}>
        Provide a detailed description of your circular economy business idea. Include:
      </p>
      <ul style={{ paddingLeft: '24px', lineHeight: '1.8' }}>
        <li>
          <strong>Materials:</strong> What materials or resources are being reused, recycled, or
          recovered?
        </li>
        <li>
          <strong>Process:</strong> How does your business model close the loop?
        </li>
        <li>
          <strong>Stakeholders:</strong> Who are the key participants (suppliers, customers,
          partners)?
        </li>
        <li>
          <strong>Value Proposition:</strong> What environmental and economic benefits does it
          provide?
        </li>
        <li>
          <strong>Scale:</strong> What is the intended scope (local, regional, global)?
        </li>
      </ul>
      <p style={{ marginTop: '16px', fontStyle: 'italic', color: '#666' }}>
        A minimum of 200 characters is required for accurate AI analysis.
      </p>
    </div>
  );
}

function FactorsGuide() {
  return (
    <div>
      <p style={{ marginBottom: '20px' }}>
        Our evaluation framework assesses your business across 8 key factors grouped into 3 value
        categories:
      </p>
      {Object.entries(factorDefinitions).map(([key, factor]) => (
        <div
          key={key}
          style={{
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid #eee',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <h3 style={{ margin: 0, color: '#34a83a' }}>{factor.title}</h3>
            <span
              style={{
                fontSize: '12px',
                color: '#666',
                backgroundColor: '#f5f5f5',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              {factor.category}
            </span>
          </div>
          <p style={{ margin: 0, color: '#555', lineHeight: '1.6' }}>{factor.desc}</p>
        </div>
      ))}
    </div>
  );
}

function ParameterDetailGuide({ paramKey }) {
  const param = parameterGuidance[paramKey];

  if (!param) {
    return <div>Parameter guidance not available.</div>;
  }

  return (
    <div>
      <div
        style={{
          marginBottom: '24px',
          padding: '16px',
          background: '#f5f7fa',
          borderRadius: '8px',
          borderLeft: '4px solid #34a83a',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <h3 style={{ margin: 0, color: '#34a83a' }}>{param.name}</h3>
          <span
            style={{
              fontSize: '14px',
              color: '#666',
              backgroundColor: '#fff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: '600',
              border: '2px solid #34a83a',
            }}
          >
            Weight: {param.weightPercent}
          </span>
        </div>
        <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
          {param.category}
        </p>
        <p style={{ margin: '8px 0 0 0', color: '#555', fontSize: '13px', lineHeight: '1.5' }}>
          This parameter contributes <strong>{param.weightPercent}</strong> to your overall circular
          economy score.
        </p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h4
          style={{
            margin: '0 0 12px 0',
            color: '#2c3e50',
            fontSize: '16px',
            borderBottom: '2px solid #e0e0e0',
            paddingBottom: '8px',
          }}
        >
          📋 Definition
        </h4>
        <p style={{ margin: 0, lineHeight: '1.7', color: '#555', fontSize: '15px' }}>
          {param.definition}
        </p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h4
          style={{
            margin: '0 0 12px 0',
            color: '#2c3e50',
            fontSize: '16px',
            borderBottom: '2px solid #e0e0e0',
            paddingBottom: '8px',
          }}
        >
          🔬 Methodology
        </h4>
        <p style={{ margin: 0, lineHeight: '1.7', color: '#555', fontSize: '15px' }}>
          {param.methodology}
        </p>
        <div
          style={{
            background: '#e8f5e9',
            padding: '12px 16px',
            borderRadius: '6px',
            marginTop: '12px',
          }}
        >
          <p style={{ margin: 0, fontSize: '14px', color: '#2d5f2e', lineHeight: '1.6' }}>
            <strong>💡 Tip:</strong> Our AI evaluates this against proven circular economy projects
            in our database.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h4
          style={{
            margin: '0 0 12px 0',
            color: '#2c3e50',
            fontSize: '16px',
            borderBottom: '2px solid #e0e0e0',
            paddingBottom: '8px',
          }}
        >
          🎯 Calibration Guide
        </h4>
        <p
          style={{
            margin: '0 0 16px 0',
            fontStyle: 'italic',
            color: '#555',
            fontSize: '15px',
            lineHeight: '1.7',
          }}
        >
          {param.calibration}
        </p>

        <div
          style={{
            background: '#fff3e0',
            padding: '14px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
          }}
        >
          <h5 style={{ margin: '0 0 8px 0', color: '#f57c00', fontSize: '14px' }}>
            ⚠️ Self-Assessment Guidelines:
          </h5>
          <ul
            style={{
              margin: '0',
              paddingLeft: '20px',
              color: '#555',
              fontSize: '14px',
              lineHeight: '1.8',
            }}
          >
            <li>Be realistic - our AI will validate against database evidence</li>
            <li>Consider both current state AND 12-month potential</li>
            <li>Use the examples below as anchoring reference points</li>
          </ul>
        </div>

        <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
          <h5 style={{ margin: '0 0 14px 0', color: '#34a83a', fontSize: '15px' }}>
            📊 Score Scale:
          </h5>
          {param.scale &&
            param.scale.map((item, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: '12px',
                  padding: '12px',
                  background: 'white',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', color: '#34a83a', fontSize: '18px' }}>
                      {item.score}
                    </span>
                    <span style={{ fontWeight: '600', color: '#2c3e50', fontSize: '15px' }}>
                      {item.label}
                    </span>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                  {item.description}
                </p>
              </div>
            ))}
        </div>
      </div>

      {param.examples && param.examples.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4
            style={{
              margin: '0 0 12px 0',
              color: '#2c3e50',
              fontSize: '16px',
              borderBottom: '2px solid #e0e0e0',
              paddingBottom: '8px',
            }}
          >
            📚 Real-World Examples
          </h4>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
            Verified examples from our GreenTechGuardians database to calibrate your score.
          </p>
          {param.examples.map((example, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '14px',
                padding: '14px 16px',
                background: '#e3f2fd',
                borderLeft: '4px solid #4a90e2',
                borderRadius: '6px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <strong style={{ color: '#2c3e50', fontSize: '15px' }}>{example.case}</strong>
                <span style={{ fontWeight: '700', color: '#4a90e2', fontSize: '18px' }}>
                  Score: {example.score}
                </span>
              </div>
              {example.reason && (
                <p
                  style={{
                    margin: '6px 0 0 0',
                    fontSize: '14px',
                    color: '#555',
                    fontStyle: 'italic',
                    lineHeight: '1.6',
                  }}
                >
                  <strong>Why:</strong> {example.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
