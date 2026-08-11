import { useState, useEffect } from 'react';
import { FiDownload, FiX, FiPlus } from 'react-icons/fi';
import { getCv, upsertCv } from '../../services/careerService';
import styles from './CVBuilder.module.scss';

const emptyEducation = { school: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '' };
const emptyExperience = { title: '', organization: '', startDate: '', endDate: '', description: '' };

const CVBuilder = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [summary, setSummary] = useState('');
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getCv();
        if (data.cv) {
          setFullName(data.cv.fullName || '');
          setEmail(data.cv.email || '');
          setPhone(data.cv.phone || '');
          setAddress(data.cv.address || '');
          setSummary(data.cv.summary || '');
          setEducation(data.cv.education || []);
          setExperience(data.cv.experience || []);
          setSkills(data.cv.skills || []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertCv({ fullName, email, phone, address, summary, education, experience, skills, certifications: [] });
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>CV Builder</h1>
          <p className={styles.subtitle}>Build your CV — it saves automatically when you download.</p>
        </div>
        <button className={styles.downloadBtn} onClick={async () => { await handleSave(); window.print(); }}>
          <FiDownload size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
          {saving ? 'Saving...' : 'Save & Download'}
        </button>
      </div>

      <div className={styles.layout}>
        <div>
          <div className={styles.formCard}>
            <div className={styles.sectionTitle}>Contact</div>
            <div className={styles.field}>
              <label className={styles.label}>Full name</label>
              <input className={styles.input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Phone</label>
                <input className={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Address</label>
              <input className={styles.input} value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>

          <div className={styles.formCard}>
            <div className={styles.sectionTitle}>Summary</div>
            <textarea className={styles.textarea} placeholder="A short professional summary..." value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>

          <div className={styles.formCard}>
            <div className={styles.sectionTitle}>Education</div>
            {education.map((ed, i) => (
              <div key={i} className={styles.entryBlock}>
                <button className={styles.removeBtn} onClick={() => setEducation(education.filter((_, idx) => idx !== i))}><FiX size={14} /></button>
                <div className={styles.field}>
                  <label className={styles.label}>School</label>
                  <input className={styles.input} value={ed.school} onChange={(e) => setEducation(education.map((x, idx) => idx === i ? { ...x, school: e.target.value } : x))} />
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Degree</label>
                    <input className={styles.input} value={ed.degree} onChange={(e) => setEducation(education.map((x, idx) => idx === i ? { ...x, degree: e.target.value } : x))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Field of study</label>
                    <input className={styles.input} value={ed.fieldOfStudy} onChange={(e) => setEducation(education.map((x, idx) => idx === i ? { ...x, fieldOfStudy: e.target.value } : x))} />
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Start year</label>
                    <input className={styles.input} value={ed.startYear} onChange={(e) => setEducation(education.map((x, idx) => idx === i ? { ...x, startYear: e.target.value } : x))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>End year</label>
                    <input className={styles.input} value={ed.endYear} onChange={(e) => setEducation(education.map((x, idx) => idx === i ? { ...x, endYear: e.target.value } : x))} />
                  </div>
                </div>
              </div>
            ))}
            <button className={styles.addEntryBtn} onClick={() => setEducation([...education, { ...emptyEducation }])}>
              <FiPlus size={13} style={{ verticalAlign: '-2px' }} /> Add education
            </button>
          </div>

          <div className={styles.formCard}>
            <div className={styles.sectionTitle}>Experience</div>
            {experience.map((exp, i) => (
              <div key={i} className={styles.entryBlock}>
                <button className={styles.removeBtn} onClick={() => setExperience(experience.filter((_, idx) => idx !== i))}><FiX size={14} /></button>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Title</label>
                    <input className={styles.input} value={exp.title} onChange={(e) => setExperience(experience.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Organization</label>
                    <input className={styles.input} value={exp.organization} onChange={(e) => setExperience(experience.map((x, idx) => idx === i ? { ...x, organization: e.target.value } : x))} />
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Start date</label>
                    <input className={styles.input} value={exp.startDate} onChange={(e) => setExperience(experience.map((x, idx) => idx === i ? { ...x, startDate: e.target.value } : x))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>End date</label>
                    <input className={styles.input} value={exp.endDate} onChange={(e) => setExperience(experience.map((x, idx) => idx === i ? { ...x, endDate: e.target.value } : x))} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Description</label>
                  <textarea className={styles.textarea} value={exp.description} onChange={(e) => setExperience(experience.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x))} />
                </div>
              </div>
            ))}
            <button className={styles.addEntryBtn} onClick={() => setExperience([...experience, { ...emptyExperience }])}>
              <FiPlus size={13} style={{ verticalAlign: '-2px' }} /> Add experience
            </button>
          </div>

          <div className={styles.formCard}>
            <div className={styles.sectionTitle}>Skills</div>
            <div className={styles.tagInput}>
              <input
                className={styles.input}
                placeholder="e.g. Python"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <button className={styles.addEntryBtn} style={{ width: 'auto', paddingInline: '1rem' }} onClick={addSkill}>Add</button>
            </div>
            <div className={styles.tags}>
              {skills.map((s) => (
                <span key={s} className={styles.tag}>
                  {s} <FiX size={12} className={styles.tagRemove} onClick={() => setSkills(skills.filter((x) => x !== s))} />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.previewWrap}>
          <div className={styles.previewName}>{fullName || 'Your name'}</div>
          <div className={styles.previewContact}>{[email, phone, address].filter(Boolean).join(' · ')}</div>

          {summary && (
            <div className={styles.previewSection}>
              <div className={styles.previewSectionTitle}>Summary</div>
              <p className={styles.previewEntryDesc}>{summary}</p>
            </div>
          )}

          {education.length > 0 && (
            <div className={styles.previewSection}>
              <div className={styles.previewSectionTitle}>Education</div>
              {education.map((ed, i) => (
                <div key={i} className={styles.previewEntry}>
                  <div className={styles.previewEntryTitle}>{ed.degree} {ed.fieldOfStudy && `in ${ed.fieldOfStudy}`}</div>
                  <div className={styles.previewEntryMeta}>{ed.school} · {ed.startYear}–{ed.endYear || 'Present'}</div>
                </div>
              ))}
            </div>
          )}

          {experience.length > 0 && (
            <div className={styles.previewSection}>
              <div className={styles.previewSectionTitle}>Experience</div>
              {experience.map((exp, i) => (
                <div key={i} className={styles.previewEntry}>
                  <div className={styles.previewEntryTitle}>{exp.title}</div>
                  <div className={styles.previewEntryMeta}>{exp.organization} · {exp.startDate}–{exp.endDate || 'Present'}</div>
                  {exp.description && <p className={styles.previewEntryDesc}>{exp.description}</p>}
                </div>
              ))}
            </div>
          )}

          {skills.length > 0 && (
            <div className={styles.previewSection}>
              <div className={styles.previewSectionTitle}>Skills</div>
              <div className={styles.previewTags}>
                {skills.map((s) => <span key={s} className={styles.previewTag}>{s}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CVBuilder;
