import './ComingSoon.css'

export default function ComingSoon({ title, description }) {
  return (
    <div className="coming-soon">
      <div className="coming-soon__badge">Coming soon</div>
      <h1 className="coming-soon__title">{title}</h1>
      <p className="coming-soon__desc">{description}</p>
    </div>
  )
}
