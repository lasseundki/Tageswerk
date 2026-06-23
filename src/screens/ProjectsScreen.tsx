import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppStateContext } from '../hooks/useFirestoreState';
import type { Project } from '../types';
import Modal from '../components/ui/Modal';

interface Props {
  ctx: AppStateContext;
}

interface ProjectFormData {
  name: string;
  description: string;
  categoryId: string;
}

export default function ProjectsScreen({ ctx }: Props) {
  const { t } = useTranslation();
  const { state, addProject, updateProject, deleteProject } = ctx;

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [addingProject, setAddingProject] = useState(false);
  const [form, setForm] = useState<ProjectFormData>({ name: '', description: '', categoryId: '' });

  const openAdd = () => {
    setForm({ name: '', description: '', categoryId: state.categories[0]?.id ?? '' });
    setAddingProject(true);
  };

  const openEdit = (p: Project) => {
    setForm({ name: p.name, description: p.description ?? '', categoryId: p.categoryId });
    setEditingProject(p);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingProject) {
      updateProject(editingProject.id, { name: form.name.trim(), description: form.description.trim() || undefined, categoryId: form.categoryId });
      setEditingProject(null);
    } else {
      addProject({ name: form.name.trim(), description: form.description.trim() || undefined, categoryId: form.categoryId, isArchived: false });
      setAddingProject(false);
    }
  };

  const active = state.projects.filter(p => !p.isArchived);
  const archived = state.projects.filter(p => p.isArchived);

  const getCategory = (id: string) => state.categories.find(c => c.id === id);

  const taskCount = (projectId: string) =>
    state.tasks.filter(t => t.projectId === projectId && t.status === 'active').length;

  const completedCount = (projectId: string) =>
    state.tasks.filter(t => t.projectId === projectId && t.status === 'completed').length;

  const set = <K extends keyof ProjectFormData>(k: K, v: ProjectFormData[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const formModal = (title: string, onClose: () => void) => (
    <Modal
      isOpen
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost btn-md" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary btn-md" onClick={handleSave} disabled={!form.name.trim()}>
            {t('common.save')}
          </button>
        </>
      }
    >
      <div className="form-section">
        <div>
          <label className="input-label">{t('project.name')}</label>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
        </div>
        <div>
          <label className="input-label">{t('form.description')}</label>
          <textarea className="input day-note-area" style={{ minHeight: 60 }}
            value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
        <div>
          <label className="input-label">{t('form.category')}</label>
          <select className="input" value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
            {state.categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );

  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen-title">{t('nav.projects')}</h1>
        <button className="btn btn-outline btn-sm" onClick={openAdd}>
          + {t('project.add')}
        </button>
      </div>

      {active.length === 0 && archived.length === 0 ? (
        <div className="empty-state">{t('projects.empty')}</div>
      ) : (
        <>
          <div className="project-grid">
            {active.map(project => {
              const cat = getCategory(project.categoryId);
              const active_count = taskCount(project.id);
              const done_count = completedCount(project.id);
              return (
                <div key={project.id} className="project-card">
                  <div className="project-card-header">
                    <h3 className="project-card-name">{project.name}</h3>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(project)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>
                  {cat && (
                    <span className="project-card-category">
                      <span className="category-dot" style={{ background: cat.color }} />
                      {cat.icon} {cat.name}
                    </span>
                  )}
                  {project.description && (
                    <p className="project-card-desc">{project.description}</p>
                  )}
                  <div className="project-card-stats">
                    <span>{active_count} {t('project.activeTasks')}</span>
                    <span>{done_count} {t('project.completedTasks')}</span>
                  </div>
                  <div className="project-card-actions">
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => updateProject(project.id, { isArchived: true })}>
                      {t('project.archive')}
                    </button>
                    <button className="btn btn-danger btn-sm"
                      onClick={() => { if (confirm(t('form.confirmDelete'))) deleteProject(project.id); }}>
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {archived.length > 0 && (
            <section>
              <h2 className="section-title">{t('project.archived')}</h2>
              <div className="project-grid">
                {archived.map(project => (
                  <div key={project.id} className="project-card archived">
                    <div className="project-card-header">
                      <h3 className="project-card-name">{project.name}</h3>
                    </div>
                    <div className="project-card-actions">
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => updateProject(project.id, { isArchived: false })}>
                        {t('project.unarchive')}
                      </button>
                      <button className="btn btn-danger btn-sm"
                        onClick={() => { if (confirm(t('form.confirmDelete'))) deleteProject(project.id); }}>
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {addingProject && formModal(t('project.add'), () => setAddingProject(false))}
      {editingProject && formModal(t('project.edit'), () => setEditingProject(null))}
    </div>
  );
}

