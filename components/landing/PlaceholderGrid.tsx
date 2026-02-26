export default function PlaceholderGrid() {
  return (
    <section className="w-full grid grid-cols-1 sm:grid-cols-3 divide-x-[5px] divide-white">
      {[0, 1, 2].map((i) => (
        <div key={i} className="aspect-video bg-base-200" />
      ))}
    </section>
  );
}
