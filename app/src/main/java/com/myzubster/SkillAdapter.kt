package com.myzubster

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.myzubster.models.Skill

class SkillAdapter(
    private var skills: List<Skill> = emptyList()
) : RecyclerView.Adapter<SkillAdapter.SkillViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SkillViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_skill, parent, false)
        return SkillViewHolder(view)
    }

    override fun onBindViewHolder(holder: SkillViewHolder, position: Int) {
        holder.bind(skills[position])
    }

    override fun getItemCount(): Int = skills.size

    fun submitList(newSkills: List<Skill>) {
        skills = newSkills
        notifyDataSetChanged()
    }

    class SkillViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val titleTextView = itemView.findViewById<TextView>(R.id.tvSkillTitle)
        private val categoryTextView = itemView.findViewById<TextView>(R.id.tvSkillCategory)
        private val distanceTextView = itemView.findViewById<TextView>(R.id.tvSkillDistance)
        private val priceTextView = itemView.findViewById<TextView>(R.id.tvSkillPrice)

        fun bind(skill: Skill) {
            titleTextView.text = skill.title
            categoryTextView.text = skill.category
            distanceTextView.text = skill.distanceKm?.let { "%.1f km".format(it) } ?: "Distanza non disponibile"
            priceTextView.text = skill.priceXmr?.let { "$it XMR" } ?: "Gratis"
        }
    }
}
